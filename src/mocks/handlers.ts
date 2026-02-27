import { http, HttpResponse } from 'msw';
import {
  mockProjectList,
  mockBlockList,
  mockNetverList,
  mockRevisionList,
  mockEconumList,
  mockFunctionList,
  mockMethodList,
  mockPtpxPowerData,
  mockTimingSummaryData,
  mockLayoutData,
  mockPhysicalInfoData,
  mockLayoutWiringTotalData,
  mockLayoutRuntimeData,
  mockFormalityData,
} from './data/fixtures';

type SavedSetupRecord = {
  id: string;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const mockAuthUser = {
  id: '11111111-1111-1111-1111-111111111111',
  username: 'e2e-user',
  email: 'e2e@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
};

let mockSavedSetups: SavedSetupRecord[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  return `setup-${Math.random().toString(36).slice(2, 10)}`;
}

export const handlers = [
  http.post('/api/v1/auth/login', async () => {
    return HttpResponse.json(
      {
        access_token: 'e2e-token',
        token_type: 'bearer',
      },
      { status: 200 },
    );
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
      email?: string;
    };

    return HttpResponse.json(
      {
        ...mockAuthUser,
        username: body.username ?? mockAuthUser.username,
        email: body.email ?? mockAuthUser.email,
      },
      { status: 201 },
    );
  }),

  http.get('/api/v1/auth/me', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return HttpResponse.json(mockAuthUser, { status: 200 });
  }),

  http.get('/api/v1/doe-setups', () => {
    return HttpResponse.json(mockSavedSetups, { status: 200 });
  }),

  http.post('/api/v1/doe-setups', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      config?: Record<string, unknown>;
    };

    const timestamp = nowIso();
    const nextSetup: SavedSetupRecord = {
      id: randomId(),
      name: body.name ?? 'Untitled setup',
      config: body.config ?? {},
      created_at: timestamp,
      updated_at: timestamp,
    };

    mockSavedSetups = [nextSetup, ...mockSavedSetups];
    return HttpResponse.json(nextSetup, { status: 201 });
  }),

  http.delete('/api/v1/doe-setups/:setupId', ({ params }) => {
    const setupId = String(params.setupId ?? '');
    mockSavedSetups = mockSavedSetups.filter((setup) => setup.id !== setupId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/get_project', () => {
    return HttpResponse.json(mockProjectList);
  }),

  http.post('/api/get_block_list', () => {
    return HttpResponse.json(mockBlockList);
  }),

  http.post('/api/get_netver_list', () => {
    return HttpResponse.json(mockNetverList);
  }),

  http.post('/api/get_revision_list', () => {
    return HttpResponse.json(mockRevisionList);
  }),

  http.post('/api/get_econum_list', () => {
    return HttpResponse.json(mockEconumList);
  }),

  http.get('/api/get_all_function', () => {
    return HttpResponse.json(mockFunctionList);
  }),

  http.get('/api/get_method_list', () => {
    return HttpResponse.json(mockMethodList);
  }),

  http.post('/api/get_ptpxpower', () => {
    return HttpResponse.json(mockPtpxPowerData);
  }),

  http.post('/api/get_timing_summary', () => {
    return HttpResponse.json(mockTimingSummaryData);
  }),

  http.post('/api/get_layoutcellusage', () => {
    return HttpResponse.json(mockLayoutData);
  }),

  http.post('/api/get_syncellusage', () => {
    return HttpResponse.json(mockLayoutData);
  }),

  http.post('/api/get_layoutpnrdrcsummary', () => {
    return HttpResponse.json(mockPhysicalInfoData);
  }),

  http.post('/api/get_layoutwiringtotal', () => {
    return HttpResponse.json(mockLayoutWiringTotalData);
  }),

  http.post('/api/get_layoutruntime', () => {
    return HttpResponse.json(mockLayoutRuntimeData);
  }),

  http.post('/api/get_formality', () => {
    return HttpResponse.json(mockFormalityData);
  }),

  http.post('/api/get_check_tool', () => {
    return HttpResponse.json({
      check_tool_data: {
        html: {
          html_data: `
            <div class="p-4 border rounded-md bg-white dark:bg-slate-900">
              <h3 class="text-lg font-bold mb-4">FC Check Results</h3>
              <table class="w-full text-sm text-left">
                <thead class="text-xs uppercase bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th class="px-6 py-3">Check Item</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Design Consistency</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">No issues found in hierarchy</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Timing Constraints</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">All constraints met</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Power Domain</td>
                    <td class="px-6 py-4 text-yellow-600 font-bold">WARNING</td>
                    <td class="px-6 py-4">Unused power domain definitions</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Signal Integrity</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">Noise margin within limits</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Clock Domain Crossing</td>
                    <td class="px-6 py-4 text-red-600 font-bold">FAIL</td>
                    <td class="px-6 py-4">Unsynchronized crossings detected in block_mem_ctrl</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">LVS Check</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">Layout matches schematic</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">DRC Check</td>
                    <td class="px-6 py-4 text-yellow-600 font-bold">WARNING</td>
                    <td class="px-6 py-4">3 non-critical spacing violations</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Antenna Check</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">No antenna violations found</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">ERC Check</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">Electrical rules check passed</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Soft Check</td>
                    <td class="px-6 py-4 text-gray-500 font-bold">SKIPPED</td>
                    <td class="px-6 py-4">Soft check disabled in configuration</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Connectivity Check</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">All nets fully connected</td>
                  </tr>
                  <tr class="border-b">
                    <td class="px-6 py-4 font-medium">Density Check</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">Poly density within range (35%)</td>
                  </tr>
                  <tr>
                    <td class="px-6 py-4 font-medium">Metal Density</td>
                    <td class="px-6 py-4 text-green-600 font-bold">PASS</td>
                    <td class="px-6 py-4">M1-M10 density acceptable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
        }
      }
    });
  }),
];
