// API 配置
export const API_BASE_URL = 'https://api.seanholisticworkspace.com';  // 替换为你的 Cloudflare Tunnel 域名

// API 端点
export const API_ENDPOINTS = {
    upload: `${API_BASE_URL}/upload`,
    sem: `${API_BASE_URL}/sem`,
    feedback: `${API_BASE_URL}/feedback`,
    chat: `${API_BASE_URL}/chat`,
    dataType: `${API_BASE_URL}/data_type`,
    timeseriesPlot: `${API_BASE_URL}/finance/timeseries_plot`,
    timeseriesModel: `${API_BASE_URL}/finance/timeseries_model`,
    test: `${API_BASE_URL}/test`
}; 