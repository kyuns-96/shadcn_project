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

export const handlers = [
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
];
