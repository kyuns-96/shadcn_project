/**
 * Vite Plugin: Auto Font Generator
 *
 * 폰트 폴더를 스캔하여 자동으로 @font-face CSS를 생성합니다.
 * TTF 파일을 WOFF2로 자동 변환합니다 (fonttools 사용).
 * 파일명에서 weight를 자동 추출하고, unicode-range로 한글/영어 자동 분리합니다.
 *
 * 지원 폰트:
 * - English: 200~800, 200C~800C
 * - Korean: 200~700, 200C~700C
 *
 * 파일명 패턴:
 * - Prefix200Suffix.ttf (숫자가 중간에)
 * - Prefix200CSuffix.ttf (C 접미사 = Condensed)
 *
 * 필수 Python 패키지:
 * - pip install fonttools brotli
 */

import type { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================
// CONFIGURATION
// ============================================

export interface LanguageConfig {
  folder: string;
  minWeight: number;
  maxWeight: number;
}

export interface AutoFontOptions {
  /**
   * 폰트 디렉토리 경로 (public 기준)
   * @default 'fonts/Example'
   */
  fontDir?: string;

  /**
   * 폰트 이름 (CSS font-family에 사용)
   * @default 'CustomFont'
   */
  fontFamily?: string;

  /**
   * 언어별 설정 (폴더명, weight 범위)
   */
  languages?: {
    korean?: LanguageConfig;
    english?: LanguageConfig;
  };

  /**
   * Unicode Range 사용 여부 (lang 속성 없이 자동 분리)
   * @default true
   */
  useUnicodeRange?: boolean;

  /**
   * 생성된 CSS를 저장할 파일 경로
   * @default 'src/styles/auto-fonts.css'
   */
  outputPath?: string;

  /**
   * TTF를 WOFF2로 자동 변환
   * @default true
   */
  convertToWoff2?: boolean;

  /**
   * 디버그 모드
   * @default false
   */
  debug?: boolean;
}

// ============================================
// UNICODE RANGES
// ============================================

const UNICODE_RANGES = {
  // 한글 완성형 + 자모 + 호환 자모
  korean: "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF",

  // 기본 라틴 + 라틴 확장 + 숫자 + 특수문자
  english:
    "U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F, U+2000-206F, U+20A0-20CF",
};

// ============================================
// FONT INFO TYPE
// ============================================

interface FontInfo {
  file: string;
  weight: number;
  hasCSuffix: boolean;
  format: "woff2" | "truetype" | "opentype";
}

// ============================================
// TTF TO WOFF2 CONVERSION
// ============================================

/**
 * Python fonttools를 사용하여 TTF를 WOFF2로 변환
 * pip install fonttools brotli 필요
 */
function convertTtfToWoff2(ttfPath: string, debug: boolean): string | null {
  const woff2Path = ttfPath.replace(/\.ttf$/i, ".woff2");

  // 이미 woff2 파일이 있으면 변환 스킵
  if (fs.existsSync(woff2Path)) {
    const ttfStat = fs.statSync(ttfPath);
    const woff2Stat = fs.statSync(woff2Path);

    // TTF가 더 최신이면 다시 변환
    if (ttfStat.mtime <= woff2Stat.mtime) {
      if (debug) console.log(`   [skip] ${path.basename(woff2Path)} already exists`);
      return woff2Path;
    }
  }

  try {
    // Python fonttools 사용
    const pythonScript = `
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress

font = TTFont("${ttfPath.replace(/\\/g, "/")}")
compress("${ttfPath.replace(/\\/g, "/")}", "${woff2Path.replace(/\\/g, "/")}")
print("OK")
`;

    const result = execSync(`python3 -c '${pythonScript}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.trim() === "OK") {
      if (debug) console.log(`   [convert] ${path.basename(ttfPath)} → ${path.basename(woff2Path)}`);
      return woff2Path;
    }
  } catch (error) {
    // python3 실패시 python 시도
    try {
      const pythonScript = `
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress

font = TTFont("${ttfPath.replace(/\\/g, "/")}")
compress("${ttfPath.replace(/\\/g, "/")}", "${woff2Path.replace(/\\/g, "/")}")
print("OK")
`;

      const result = execSync(`python -c '${pythonScript}'`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (result.trim() === "OK") {
        if (debug) console.log(`   [convert] ${path.basename(ttfPath)} → ${path.basename(woff2Path)}`);
        return woff2Path;
      }
    } catch (innerError) {
      console.warn(`   [warn] Failed to convert ${path.basename(ttfPath)}: fonttools not installed?`);
      console.warn(`          Run: pip install fonttools brotli`);
      return null;
    }
  }

  return null;
}

/**
 * 폴더 내 모든 TTF 파일을 WOFF2로 변환
 */
function convertAllTtfInFolder(folderPath: string, debug: boolean): void {
  if (!fs.existsSync(folderPath)) return;

  const ttfFiles = fs.readdirSync(folderPath).filter((f) => /\.ttf$/i.test(f));

  if (ttfFiles.length === 0) return;

  if (debug) console.log(`\n   Converting TTF to WOFF2 in ${path.basename(folderPath)}/`);

  for (const ttfFile of ttfFiles) {
    const ttfPath = path.join(folderPath, ttfFile);
    convertTtfToWoff2(ttfPath, debug);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * 파일명에서 font-weight와 C 접미사 여부 추출
 *
 * 지원 패턴:
 * - Prefix200Suffix.ttf → weight: 200, hasCSuffix: false
 * - Prefix200CSuffix.ttf → weight: 200, hasCSuffix: true
 * - Prefix200C.ttf → weight: 200, hasCSuffix: true
 * - 200.ttf → weight: 200, hasCSuffix: false
 * - 200C.ttf → weight: 200, hasCSuffix: true
 */
function extractFontInfo(filename: string): Omit<FontInfo, "format"> | null {
  // 확장자 제거
  const nameWithoutExt = filename.replace(/\.(ttf|otf|woff2?)$/i, "");

  // C 접미사 패턴: 숫자3자리 바로 뒤에 C가 오는 경우
  const cPattern = /(\d{3})C/i;
  const cMatch = nameWithoutExt.match(cPattern);

  if (cMatch) {
    const weight = parseInt(cMatch[1], 10);
    if (isValidWeight(weight)) {
      return { file: filename, weight, hasCSuffix: true };
    }
  }

  // 일반 패턴: 숫자3자리 (C가 바로 뒤에 없는 경우)
  const normalPattern = /(\d{3})(?![C0-9])/i;
  const normalMatch = nameWithoutExt.match(normalPattern);

  if (normalMatch) {
    const weight = parseInt(normalMatch[1], 10);
    if (isValidWeight(weight)) {
      return { file: filename, weight, hasCSuffix: false };
    }
  }

  // 마지막 시도: 아무 3자리 숫자
  const anyPattern = /(\d{3})/;
  const anyMatch = nameWithoutExt.match(anyPattern);

  if (anyMatch) {
    const weight = parseInt(anyMatch[1], 10);
    if (isValidWeight(weight)) {
      // C가 숫자 바로 뒤에 있는지 다시 확인
      const hasC =
        nameWithoutExt.includes(anyMatch[1] + "C") ||
        nameWithoutExt.includes(anyMatch[1] + "c");
      return { file: filename, weight, hasCSuffix: hasC };
    }
  }

  return null;
}

/**
 * 유효한 font-weight인지 확인 (100~900 범위)
 */
function isValidWeight(weight: number): boolean {
  return weight >= 100 && weight <= 900 && weight % 100 === 0;
}

/**
 * 언어별 weight 범위 검증
 */
function isWeightInRange(
  weight: number,
  minWeight: number,
  maxWeight: number
): boolean {
  return weight >= minWeight && weight <= maxWeight;
}

/**
 * 디렉토리 내 폰트 파일 스캔 (WOFF2 우선)
 */
function scanFontFiles(dirPath: string, preferWoff2: boolean): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const allFiles = fs.readdirSync(dirPath).filter((file) =>
    /\.(ttf|otf|woff2?)$/i.test(file)
  );

  if (!preferWoff2) {
    return allFiles;
  }

  // WOFF2 파일이 있으면 해당 TTF/OTF 제외
  const woff2Files = allFiles.filter((f) => /\.woff2$/i.test(f));
  const woff2Basenames = woff2Files.map((f) =>
    f.replace(/\.woff2$/i, "").toLowerCase()
  );

  return allFiles.filter((file) => {
    if (/\.woff2$/i.test(file)) return true;

    const basename = file.replace(/\.(ttf|otf|woff)$/i, "").toLowerCase();
    // 같은 이름의 WOFF2가 있으면 제외
    return !woff2Basenames.includes(basename);
  });
}

/**
 * @font-face CSS 생성
 *
 * C 접미사 = Condensed (좁은 글꼴)
 * font-stretch 속성으로 구분
 */
function generateFontFaceCSS(
  fontFamily: string,
  fontPath: string,
  weight: number,
  isCondensed: boolean,
  format: string,
  unicodeRange?: string
): string {
  let css = `@font-face {
  font-family: "${fontFamily}";
  src: url("${fontPath}") format("${format}");
  font-weight: ${weight};
  font-style: normal;
  font-stretch: ${isCondensed ? "condensed" : "normal"};
  font-display: swap;`;

  if (unicodeRange) {
    css += `\n  unicode-range: ${unicodeRange};`;
  }

  css += "\n}";

  return css;
}

/**
 * Weight 통계 생성
 */
function generateWeightStats(
  koreanFonts: FontInfo[],
  englishFonts: FontInfo[]
): string {
  const koreanNormal = koreanFonts
    .filter((f) => !f.hasCSuffix)
    .map((f) => f.weight)
    .sort((a, b) => a - b);
  const koreanCondensed = koreanFonts
    .filter((f) => f.hasCSuffix)
    .map((f) => f.weight)
    .sort((a, b) => a - b);
  const englishNormal = englishFonts
    .filter((f) => !f.hasCSuffix)
    .map((f) => f.weight)
    .sort((a, b) => a - b);
  const englishCondensed = englishFonts
    .filter((f) => f.hasCSuffix)
    .map((f) => f.weight)
    .sort((a, b) => a - b);

  return `
/*
 * Available Font Weights:
 * 
 * Korean (200-700):
 *   Normal (font-stretch: normal): ${koreanNormal.join(", ") || "none"}
 *   Condensed (font-stretch: condensed): ${koreanCondensed.join(", ") || "none"}
 * 
 * English (200-800):
 *   Normal (font-stretch: normal): ${englishNormal.join(", ") || "none"}
 *   Condensed (font-stretch: condensed): ${englishCondensed.join(", ") || "none"}
 */`;
}

/**
 * 파일 확장자에서 포맷 결정
 */
function getFormatFromExtension(filename: string): FontInfo["format"] {
  if (/\.woff2$/i.test(filename)) return "woff2";
  if (/\.otf$/i.test(filename)) return "opentype";
  return "truetype";
}

// ============================================
// MAIN PLUGIN
// ============================================

export default function autoFontPlugin(options: AutoFontOptions = {}): Plugin {
  const {
    fontDir = "fonts/Example",
    fontFamily = "CustomFont",
    languages = {
      korean: { folder: "Korean", minWeight: 200, maxWeight: 700 },
      english: { folder: "English", minWeight: 200, maxWeight: 800 },
    },
    useUnicodeRange = true,
    outputPath = "src/styles/auto-fonts.css",
    convertToWoff2 = true,
    debug = false,
  } = options;

  const log = (message: string) => {
    if (debug) console.log(`[auto-font] ${message}`);
  };

  return {
    name: "vite-plugin-auto-font",

    buildStart() {
      log("Starting font scan...");

      const publicDir = path.resolve(process.cwd(), "public");
      const fontBasePath = path.join(publicDir, fontDir);

      if (!fs.existsSync(fontBasePath)) {
        console.warn(`[auto-font] Font directory not found: ${fontBasePath}`);
        return;
      }

      // TTF → WOFF2 변환
      if (convertToWoff2) {
        console.log("\n🔄 [auto-font] Converting TTF to WOFF2...");

        if (languages.korean) {
          const koreanPath = path.join(fontBasePath, languages.korean.folder);
          convertAllTtfInFolder(koreanPath, debug);
        }

        if (languages.english) {
          const englishPath = path.join(fontBasePath, languages.english.folder);
          convertAllTtfInFolder(englishPath, debug);
        }
      }

      const cssRules: string[] = [];
      const koreanFonts: FontInfo[] = [];
      const englishFonts: FontInfo[] = [];
      const warnings: string[] = [];

      // 한국어 폰트 스캔 (200~700, 200C~700C)
      if (languages.korean) {
        const { folder, minWeight, maxWeight } = languages.korean;
        const koreanPath = path.join(fontBasePath, folder);
        const files = scanFontFiles(koreanPath, convertToWoff2);

        log(`Found ${files.length} Korean font files in ${folder}/`);

        for (const file of files) {
          const fontInfo = extractFontInfo(file);

          if (!fontInfo) {
            warnings.push(`Korean: Could not extract weight from "${file}"`);
            continue;
          }

          const { weight, hasCSuffix } = fontInfo;

          // Weight 범위 검증
          if (!isWeightInRange(weight, minWeight, maxWeight)) {
            warnings.push(
              `Korean: Weight ${weight}${
                hasCSuffix ? "C" : ""
              } out of range (${minWeight}-${maxWeight}) - "${file}"`
            );
            continue;
          }

          const format = getFormatFromExtension(file);
          const fontPath = `/${fontDir}/${folder}/${file}`;
          const unicodeRange = useUnicodeRange
            ? UNICODE_RANGES.korean
            : undefined;

          cssRules.push(
            generateFontFaceCSS(
              fontFamily,
              fontPath,
              weight,
              hasCSuffix,
              format,
              unicodeRange
            )
          );
          koreanFonts.push({ ...fontInfo, format });

          log(`  ✓ ${file} → weight: ${weight}${hasCSuffix ? " (Condensed)" : ""} [${format}]`);
        }
      }

      // 영어 폰트 스캔 (200~800, 200C~800C)
      if (languages.english) {
        const { folder, minWeight, maxWeight } = languages.english;
        const englishPath = path.join(fontBasePath, folder);
        const files = scanFontFiles(englishPath, convertToWoff2);

        log(`Found ${files.length} English font files in ${folder}/`);

        for (const file of files) {
          const fontInfo = extractFontInfo(file);

          if (!fontInfo) {
            warnings.push(`English: Could not extract weight from "${file}"`);
            continue;
          }

          const { weight, hasCSuffix } = fontInfo;

          // Weight 범위 검증
          if (!isWeightInRange(weight, minWeight, maxWeight)) {
            warnings.push(
              `English: Weight ${weight}${
                hasCSuffix ? "C" : ""
              } out of range (${minWeight}-${maxWeight}) - "${file}"`
            );
            continue;
          }

          const format = getFormatFromExtension(file);
          const fontPath = `/${fontDir}/${folder}/${file}`;
          const unicodeRange = useUnicodeRange
            ? UNICODE_RANGES.english
            : undefined;

          cssRules.push(
            generateFontFaceCSS(
              fontFamily,
              fontPath,
              weight,
              hasCSuffix,
              format,
              unicodeRange
            )
          );
          englishFonts.push({ ...fontInfo, format });

          log(`  ✓ ${file} → weight: ${weight}${hasCSuffix ? " (Condensed)" : ""} [${format}]`);
        }
      }

      // 경고 출력
      if (warnings.length > 0) {
        console.warn("\n⚠️  [auto-font] Warnings:");
        warnings.forEach((w) => console.warn(`   ${w}`));
      }

      if (cssRules.length === 0) {
        console.warn(
          "[auto-font] No font files found or could not extract weights"
        );
        return;
      }

      // Weight 통계 생성
      const weightStats = generateWeightStats(koreanFonts, englishFonts);

      // CSS 변수 및 기본 스타일 생성
      const koreanWeights = koreanFonts.map((f) => f.weight);
      const englishWeights = englishFonts.map((f) => f.weight);

      const minKorean =
        koreanWeights.length > 0 ? Math.min(...koreanWeights) : 200;
      const maxKorean =
        koreanWeights.length > 0 ? Math.max(...koreanWeights) : 700;
      const minEnglish =
        englishWeights.length > 0 ? Math.min(...englishWeights) : 200;
      const maxEnglish =
        englishWeights.length > 0 ? Math.max(...englishWeights) : 800;

      const woff2Count = [...koreanFonts, ...englishFonts].filter(
        (f) => f.format === "woff2"
      ).length;
      const totalCount = koreanFonts.length + englishFonts.length;

      const cssVariables = `
/* ============================================
 * Auto-generated Font CSS
 * Generated by vite-plugin-auto-font
 * Do not edit manually - regenerated on build
 * 
 * Korean: ${languages.korean?.minWeight || 200}~${
        languages.korean?.maxWeight || 700
      } (+ Condensed variants)
 * English: ${languages.english?.minWeight || 200}~${
        languages.english?.maxWeight || 800
      } (+ Condensed variants)
 * 
 * Format: ${woff2Count}/${totalCount} files are WOFF2
 * ============================================ */
${weightStats}

:root {
  /* Available weight ranges */
  --font-weight-min-korean: ${minKorean};
  --font-weight-max-korean: ${maxKorean};
  --font-weight-min-english: ${minEnglish};
  --font-weight-max-english: ${maxEnglish};
}
`;

      // 최종 CSS 생성
      const finalCSS = cssVariables + "\n" + cssRules.join("\n\n");

      // 파일 저장
      const outputFullPath = path.resolve(process.cwd(), outputPath);
      const outputDir = path.dirname(outputFullPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputFullPath, finalCSS, "utf-8");

      // 결과 출력
      console.log(
        `\n✅ [auto-font] Generated ${cssRules.length} @font-face rules`
      );
      console.log(
        `   Korean: ${koreanFonts.length} fonts (weight ${languages.korean?.minWeight}-${languages.korean?.maxWeight})`
      );
      console.log(
        `   English: ${englishFonts.length} fonts (weight ${languages.english?.minWeight}-${languages.english?.maxWeight})`
      );
      console.log(`   Format: ${woff2Count}/${totalCount} WOFF2`);
      console.log(`   Output: ${outputPath}`);

      if (debug) {
        console.log("\n   Korean fonts:");
        koreanFonts.forEach((f) => {
          console.log(
            `     - ${f.file} (weight: ${f.weight}${
              f.hasCSuffix ? ", Condensed" : ""
            }) [${f.format}]`
          );
        });
        console.log("\n   English fonts:");
        englishFonts.forEach((f) => {
          console.log(
            `     - ${f.file} (weight: ${f.weight}${
              f.hasCSuffix ? ", Condensed" : ""
            }) [${f.format}]`
          );
        });
      }

      console.log("");
    },

    // HMR 지원: 폰트 파일 변경 시 재생성
    handleHotUpdate({ file }) {
      if (/\.(ttf|otf|woff2?)$/.test(file)) {
        log(`Font file changed: ${file}`);
        return [];
      }
    },
  };
}

// ============================================
// EXPORT TYPES & UTILITIES
// ============================================

export { extractFontInfo, isValidWeight, isWeightInRange, UNICODE_RANGES };
