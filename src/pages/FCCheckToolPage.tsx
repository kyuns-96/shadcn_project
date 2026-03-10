import { useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { Copy, Check } from "lucide-react";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import DOMPurify from "dompurify";

import { useFetchProjectList } from "@/hooks/useFetchProjectList";
import useFetchBlockList from "@/hooks/useFetchBlockList";
import useFetchNetverList from "@/hooks/useFetchNetverList";
import useFetchRevisionList from "@/hooks/useFetchRevisionList";

import FilterDropdownCombobox from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import type { DropdownConfig } from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import AccordionOutline from "@/components/shadcn-studio/accordion/accordion-09";
import { fetchCheckToolResult } from "@/api/fetchCheckToolResult";
import {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
  setFCHtmlContent,
  setFCError,
} from "@/store/reducers/fcCheckToolReducer";

const FCCheckToolPage = () => {
  const dispatch = useDispatch();

  // Get FC Check Tool state from Redux store (persists across page navigation)
  const {
    selectedProject,
    selectedBlock,
    selectedNetver,
    selectedRevision,
    htmlContent,
    error,
  } = useSelector((state: RootState) => state.fcCheckTool, shallowEqual);

  // Local UI state (doesn't need to persist)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    if (!htmlContent) return;

    try {
      await navigator.clipboard.writeText(htmlContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [htmlContent]);

  // Ref for the HTML content container
  const htmlContainerRef = useRef<HTMLDivElement>(null);

  // Function to apply right-alignment to numeric cells in the DOM
  const applyNumericAlignment = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return;

      // Find all td elements (not th - headers)
      const tdElements = container.querySelectorAll("td");

      tdElements.forEach((td) => {
        // Skip if it's the first cell in a row (row header)
        const row = td.parentElement;
        if (row && row.children[0] === td) return;

        // Skip if the cell contains complex elements (graphs, images, SVG, canvas, etc.)
        const hasComplexElements = td.querySelector(
          "svg, canvas, img, object, embed, iframe, video, audio, script, style"
        );
        if (hasComplexElements) return;

        // Skip if cell has child elements other than simple inline elements
        const hasBlockElements = td.querySelector(
          "div, table, p, ul, ol, pre, blockquote"
        );
        if (hasBlockElements) return;

        const text = td.textContent?.trim() || "";
        // Check if the content is numeric (including negative, decimal, percentage, with commas)
        const isNumeric =
          /^-?[\d,]+\.?\d*%?$/.test(text) ||
          /^-?\d+\.?\d*[eE][+-]?\d+$/.test(text);

        if (isNumeric) {
          (td as HTMLElement).style.textAlign = "right";
        }
      });
    },
    []
  );

  // Apply alignment using useLayoutEffect - runs synchronously after every render
  // This ensures alignment is always applied after React updates the DOM
  useLayoutEffect(() => {
    if (htmlContent && htmlContainerRef.current) {
      applyNumericAlignment(htmlContainerRef.current);
    }
  });

  // Get lists from Redux store
  const { projectList, blockList, netverList, revisionList } = useSelector(
    (state: RootState) => ({
      projectList: state.projectList,
      blockList: state.blockList,
      netverList: state.netverList,
      revisionList: state.revisionList,
    }),
    shallowEqual
  );

  // Filter revision list to exclude items with "-BE"
  const filteredRevisionList = useMemo(() => {
    const list = Array.isArray(revisionList) ? revisionList : [];
    return list.filter((item: string) => !item.includes("-BE"));
  }, [revisionList]);

  // Fetch data based on local selections
  useFetchProjectList();
  useFetchBlockList(selectedProject);
  useFetchNetverList(selectedProject, selectedBlock);
  useFetchRevisionList(selectedProject, selectedBlock, selectedNetver);

  // Handlers that reset dependent values (dispatch to Redux)
  const handleProjectChange = useCallback(
    (value: string) => {
      dispatch(setFCSelectedProject(value));
    },
    [dispatch]
  );

  const handleBlockChange = useCallback(
    (value: string) => {
      dispatch(setFCSelectedBlock(value));
    },
    [dispatch]
  );

  const handleNetverChange = useCallback(
    (value: string) => {
      dispatch(setFCSelectedNetver(value));
    },
    [dispatch]
  );

  const handleRevisionChange = useCallback(
    (value: string) => {
      dispatch(setFCSelectedRevision(value));
    },
    [dispatch]
  );

  // Build dropdown configs
  const dropdownConfigs = useMemo<DropdownConfig[]>(
    () => [
      {
        value: selectedProject,
        placeholder: "PROJECT_NAME",
        data: (Array.isArray(projectList) ? projectList : []) as string[],
        set: handleProjectChange,
      },
      {
        value: selectedBlock,
        placeholder: "BLOCK",
        data: (Array.isArray(blockList) ? blockList : []) as string[],
        set: handleBlockChange,
      },
      {
        value: selectedNetver,
        placeholder: "NET_VER",
        data: (Array.isArray(netverList) ? netverList : []) as string[],
        set: handleNetverChange,
      },
      {
        value: selectedRevision,
        placeholder: "REVISION",
        data: filteredRevisionList as string[],
        set: handleRevisionChange,
      },
    ],
    [
      selectedProject,
      selectedBlock,
      selectedNetver,
      selectedRevision,
      projectList,
      blockList,
      netverList,
      filteredRevisionList,
      handleProjectChange,
      handleBlockChange,
      handleNetverChange,
      handleRevisionChange,
    ]
  );

  // Check if all fields are selected
  const isFormComplete =
    selectedProject && selectedBlock && selectedNetver && selectedRevision;

  // Handle OK button click
  const handleOkClick = useCallback(async () => {
    if (!isFormComplete) return;

    setIsLoading(true);
    dispatch(setFCError(null));
    dispatch(setFCHtmlContent(""));

    try {
      const html = await fetchCheckToolResult({
        project: selectedProject,
        block: selectedBlock,
        netver: selectedNetver,
        revision: selectedRevision,
        eco_num: "",
      });
      // Store original HTML in Redux (alignment is applied via useLayoutEffect)
      dispatch(setFCHtmlContent(html));
    } catch (err) {
      dispatch(
        setFCError(err instanceof Error ? err.message : "An error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, [isFormComplete, dispatch, selectedProject, selectedBlock, selectedNetver, selectedRevision]);

  const accordionItems = useMemo(
    () => [
      {
        title: "Select Netlist Version",
        value: "item-1",
        content: (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-fit items-end">
                {dropdownConfigs.map((config, index) => (
                  <FilterDropdownCombobox
                    key={index}
                    dropdownConfigs={[config]}
                  />
                ))}
                <Button
                  onClick={handleOkClick}
                  disabled={!isFormComplete || isLoading}
                  className="h-9"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    "OK"
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
                {error}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Check Tool Result",
        value: "item-2",
        content: (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-[400px]">
            {htmlContent ? (
              <>
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy HTML
                      </>
                    )}
                  </Button>
                </div>
                <div
                  className="flex-1 border rounded-md p-4 bg-card overflow-auto text-foreground
                    [&_[style*='color:black']]:!text-foreground
                    [&_[style*='color:_black']]:!text-foreground
                    [&_[style*='color:#000000']]:!text-foreground
                    [&_[style*='color:_#000000']]:!text-foreground
                    [&_[style*='color:#000']]:!text-foreground
                    [&_[style*='color:_#000']]:!text-foreground
                    [&_[style*='color:rgb(0,0,0)']]:!text-foreground
                    [&_[style*='color:rgb(0,_0,_0)']]:!text-foreground
                    [&_[color='black']]:!text-foreground
                    [&_[color='#000000']]:!text-foreground
                    [&_[color='#000']]:!text-foreground
                    [&_font[color='black']]:!text-foreground
                    [&_font[color='#000000']]:!text-foreground
                    [&_font[color='#000']]:!text-foreground
                    [&_table]:border-collapse [&_table]:w-auto
                    [&_th]:p-2 [&_th]:text-left
                    [&_td]:p-2
                    [&_tr:hover]:bg-muted/50
                    [&_a]:underline
                    [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-auto
                    [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3
                    [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2
                    [&_p]:mb-2
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
                    [&_hr]:border-border [&_hr]:my-4"
                  ref={htmlContainerRef}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                추가된 데이터가 없습니다.
              </div>
            )}
          </div>
        ),
      },
    ],
    [
      dropdownConfigs,
      isFormComplete,
      isLoading,
      error,
      htmlContent,
      isCopied,
      handleOkClick,
      handleCopyToClipboard,
    ]
  );

  return (
    <div className="flex flex-col h-full">
      <AccordionOutline
        items={accordionItems}
        defaultValue={["item-1", "item-2"]}
        className="flex flex-col h-full gap-2"
      />
    </div>
  );
};

export default FCCheckToolPage;
