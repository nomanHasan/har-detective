// import './App.css'
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from '@chakra-ui/accordion';
import { Box } from '@chakra-ui/layout';
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import ReactJson from 'react-json-view'

import { v1Data } from './v1_account_statement.js'
import { v2Data } from './v2_account_statement.js'

import { getAllRequests } from './inspector.js';
import { useState } from 'react';
// import { v2Data } from './v2_account_statement.mjs'

const v1_requests = getAllRequests(v1Data);
const v2_requests = getAllRequests(v2Data);

console.log(v1_requests);
// console.log(v2_requests);
const ueFDOrQS = (request) => isEmpty(request.queryString) ? request.urlEncodedFormData : request.queryString || {};

export default function App() {
  function handleFirstEditorChange(value, event) {
    console.log(value);
  }
  function handleSecondEditorChange(value, event) {

  }

  const [v1_requests] = useState(getAllRequests(v1Data));
  const [v2_requests] = useState(getAllRequests(v2Data));

  const startingCode = `{"obj": {"a":1}}`;
  const [firstCode, setFirstCode] = useState(JSON.stringify(v1Data));
  const [secondCode, setSecondCode] = useState(JSON.stringify(v2Data));

  return (
    <div className="text-white flex flex-col h-screen">
      <div className="bg-gray-800 py-4 px-6">
        <h1 className="text-2xl font-bold">My App</h1>
        <div className="flex">
          {/* <button className="text-white font-bold py-2 px-4 mr-4">Tab 1</button>
      <button className="text-white font-bold py-2 px-4">Tab 2</button> */}
        </div>
      </div>
      <div className="flex-1 flex flex-row">
        <div className="bg-gray-700 w-1/2 p-4">
          {HAR_Inspector({ title: 'First HAR', handleEditorChange: handleFirstEditorChange, value: firstCode, startingCode, requests: v1_requests })}
        </div>
        <div className="bg-gray-600 w-1/2 p-4">
          {HAR_Inspector({ title: 'Second HAR', handleEditorChange: handleSecondEditorChange, value: secondCode, startingCode, requests: v2_requests })}
        </div>
      </div>
      <footer className="bg-gray-800 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            <p>Version 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HAR_Inspector({ title, handleEditorChange, value, startingCode, requests }) {
  console.log(requests);
  const paths = getCommonAndUniqueStrings(requests.map(request => new URL(request.url).pathname));
  return <div className="flex flex-col">
    <div className=" p-4">
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex='1' textAlign='left'>
                <h2 className='text-lg font-bold pb-4'>{title}</h2>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Editor
              height="20vh"
              theme="vs-dark"
              defaultLanguage="json"
              onChange={handleEditorChange}
              defaultValue={value} />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex='1' textAlign='left'>
                <h2 className='text-lg font-bold pb-4'>Har Modifiers</h2>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Editor
              height="20vh"
              theme="vs-dark"
              defaultLanguage="json"
              onChange={handleEditorChange}
              defaultValue={startingCode} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
    <div className=" p-4">
      <h2 className="text-lg font-bold">Inspection</h2>
      <Accordion defaultIndex={[0]} allowMultiple>
        {requests?.map((request, i) => <AccordionItem key={i}>
          <h2>
            <AccordionButton>
              <Box as="span" flex='1' textAlign='left'>
                <div className='text-sm pb-4 fle items-center'>
                  <HttpMethodTag method={request.method} />
                  <span className='mx-1'>
                    {HighlightedLetters(paths[0])}
                  </span>
                  <div className="text-xs font-bold rounded-full inline-block">
                    {paths[2][i]}
                  </div>
                  <div className="bg-gray-200 mx-1 px-2 text-black text-xs font-bold rounded-full inline-block">
                    {ueFDOrQS(request).section}
                  </div>
                  <div className="bg-gray-400 mx-1 px-2 text-black text-xs font-bold rounded-full inline-block">
                    {ueFDOrQS(request).action}
                  </div>
                  <div className="inline-block bg-gray-800 text-gray-300 font-mono text-sm px-2 py-1 rounded">
                    {jsonToMinimalString(ueFDOrQS(request))}
                  </div>
                </div>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <ReactJson src={request} theme='hopscotch' />
          </AccordionPanel>
        </AccordionItem>)}
      </Accordion>

    </div>
  </div>;
}

function excludeCommonKeys(obj) {
  const { section, action, rndval, ...rest } = obj;
  return rest;
}

function jsonToMinimalString(json) {
  json = excludeCommonKeys(json);

  function convert(obj) {
    if (Array.isArray(obj)) {
      return obj.map(convert).join(', ');
    } else if (typeof obj === 'object' && obj !== null) {
      return '{' + Object.entries(obj).map(([key, value]) => `${key}: ${convert(value)}`).join(', ') + '}';
    } else {
      return JSON.stringify(obj).replace(/[()'"\\]/g, '');
    }
  }

  return convert(json).replace(/[()'"\\]/g, '');
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}


function HttpMethodTag({ method }) {
  let bgColor = '';

  switch (method) {
    case 'GET':
      bgColor = 'bg-green-500';
      break;
    case 'POST':
      bgColor = 'bg-blue-500';
      break;
    case 'PUT':
      bgColor = 'bg-yellow-500';
      break;
    case 'DELETE':
      bgColor = 'bg-red-500';
      break;
    default:
      bgColor = 'bg-gray-500';
  }

  return (
    <div className={`text-xs inline-block rounded-full px-2 py-1 text-white font-bold ${bgColor}`}>
      {method.charAt(0)}
    </div>
  );
}

function getCommonAndUniqueStrings(arr) {
  const common = arr.reduce((prev, curr) => {
    let i = 0;
    while (prev[i] && curr[i] && prev[i] === curr[i]) {
      i++;
    }
    return prev.slice(0, i);
  });

  const unique = arr.map(str => str.replace(common, '').trim());

  const initials = common.split(/[ /\\]/).map(word => {
    const firstChar = word.charAt(0);
    return /[a-zA-Z]/.test(firstChar) ? firstChar : '';
  }).join('');

  return [common, initials.toUpperCase(), unique];
}


function HighlightedLetters(text) {

  const style = {
    backgroundColor: getHexColorFromText(text),
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem',
    borderRadius: '9999px',
    display: 'inline-block'
  };

  return (
    <div className='text-xs' style={style}>
      {text.toUpperCase().replace(/[^\w\s]/gi, '').slice(0, 2)}
    </div>
  );
}
function getHexColorFromText(text) {
  const color = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 0xffffff;
  return `#${color.toString(16).padStart(6, '0')}`;
}