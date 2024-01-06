export const endpointFullData = 'https://global.cainiao.com/global/detail.json?mailNos=';
export const endpointCheck = 'https://global.cainiao.com/global/check.json?mailNos=';

export const fetchAPI = async (URL) => {
    const response = await fetch(URL);
    const data = await response.json();
    return data;
};
