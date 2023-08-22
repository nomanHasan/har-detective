function generateUUID() {
  let uuid = '';
  const hexDigits = '0123456789abcdef';

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else {
      uuid += hexDigits[Math.floor(Math.random() * 16)];
    }
  }

  return uuid;
}

function tryParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
export const ueFDOrQS = (request) => isEmpty(request.queryString) ? request.urlEncodedFormData : request.queryString || {};

// Get All the Requestsin Array Format. In each request Object put first their names, then url, then body, then short response
export const getAllRequests = (har) => {
  return har.log.entries.map(e => {
    const request = cleanRequest(e.request);
    const response = e?.response;
    const url = request.url;
    const uuid = generateUUID();
    const body = tryParse(response?.content?.text || '{}');
    // console.log('body', body)
    // const shortResponse = response.content?.text?.slice(0, 100);

    const requestPayload = ueFDOrQS(request);

    return { url, uuid, ...request, body, response, request: requestPayload };
  });
}

// Write a function to clean request and clean the multipart formData within it
const cleanRequest = (request) => {
  const headers = cleanHeadersFromRequest(request.headers);
  const method = request.method;
  // const postData = request.postData;
  // const queryString = request.queryString;
  const url = request.url;

  const formData = extractFormData(request.postData?.text || '', headers['Content-Type']);

  const queryString = cleanQueryStringFromRequest(request.queryString);
  const urlEncodedFormData = cleanurlEncodedFormData(request.postData);
  return {
    headers,
    method,
    ...((queryString) ? { queryString } : {}),
    ...(urlEncodedFormData ? { urlEncodedFormData } : {}),
    ...(formData ? { formData } : {}),
    ['Content-Type']: headers['Content-Type'],
    url,
    response: request.response,
  };
}

function cleanurlEncodedFormData(postData = []) {
  if (!postData?.params) {
    return [];
  }
  return postData.params.map(e => {
    const name = e.name;
    const value = e.value;
    return { name, value };
  }).reduce((acc, e) => {
    acc[e.name] = e.value;
    return acc;
  }, {});
}

function extractFormData(text, contentType) {
  if (!text || !contentType || !contentType?.startsWith('multipart/form-data')) {
    return {};
  }
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
  if (!boundaryMatch) {
    throw new Error('Invalid Content-Type. Boundary not found.');
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const boundaryRegExp = new RegExp(`--${boundary}(?:--)?\\r?\\n`, 'g');
  const parts = text.split(boundaryRegExp).filter(part => !!part.trim());

  const formData = {};

  for (const part of parts) {
    const [, name, value] = part.match(/name="([^"]*)"\r\n\r\n([\s\S]*)/) || [];
    const isFile = !!part.match(/filename="/);
    if (!isFile) {
      formData[name] = value?.trim();
    }
  }

  return formData;
}

// Write function to pick only few important data ones like cross origin, content type, etc from header
const cleanHeadersFromRequest = (headers = []) => {
  if (!headers) {
    return null;
  }
  return headers.map(e => {
    const name = e.name;
    const value = e.value;
    return { name, value };
  }).filter(({ name, value }) => {
    return name === 'Origin' || name === 'Content-Type' || name === 'Accept';
  }).reduce((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }
    , {});
}

// Write a function to clean the queryString within the request
const cleanQueryStringFromRequest = (queryString) => {
  if (!queryString) {
    return null;
  }
  return queryString.map(e => {
    const name = e.name;
    const value = e.value;
    return { name, value };
  }).reduce((acc, e) => {
    acc[e.name] = e.value;
    return acc;
  }
    , {});
}

// import { v1Data } from './v1_account_statement.mjs'
// import { v2Data } from './v2_account_statement.mjs'

// const v1_requests = getAllRequests(v1Data);
// const v2_requests = getAllRequests(v2Data);

// console.log(v1_requests);
// console.log(v2_requests);