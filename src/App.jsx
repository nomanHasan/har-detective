// import './App.css'
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from '@chakra-ui/accordion';
import { Box } from '@chakra-ui/layout';
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import ReactJson from 'react-json-view'

import { v1Data } from './v1_account_statement.js'
import { v2Data } from './v2_account_statement.js'

import { getAllRequests, ueFDOrQS } from './inspector.js';
import { useEffect, useState } from 'react';
import { Button, ButtonGroup, FormControl, FormHelperText, FormLabel, IconButton, Input, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { } from '@chakra-ui/icons'

// import { v2Data } from './v2_account_statement.mjs'

const v1_requests = getAllRequests(v1Data);
const v2_requests = getAllRequests(v2Data);

console.log(v1_requests);
// console.log(v2_requests);

export default function App() {
  const handleFirstEditorChange = (value, event) => {
    setFirstCode(value);
  }
  const handleSecondEditorChange = (value, event) => {
    setSecondCode(value);
  }

  const [v1_requests, setV1_requests] = useState(getAllRequests(v1Data));
  const [v2_requests, setV2_requests] = useState(getAllRequests(v2Data));

  const startingCode = `{"obj": {"a":1}}`;
  const [firstCode, setFirstCode] = useState(JSON.stringify(v1Data));
  const [secondCode, setSecondCode] = useState(JSON.stringify(v2Data));

  const [matchTargets, setMatchTargets] = useState(['section', 'action']);

  const [matches, setMatches] = useState(findMatches(v1_requests, v2_requests, matchTargets));

  console.log({ matches });

  useEffect(() => {
    setV1_requests(getAllRequests(JSON.parse(firstCode)));

  }, [firstCode]);

  useEffect(() => {
    setV2_requests(getAllRequests(JSON.parse(secondCode)));

  }, [secondCode]);


  useEffect(() => {
    setMatches(findMatches(v1_requests, v2_requests, matchTargets));
  }, [v1_requests, v2_requests, matchTargets]);


  const onPasteClick = () => {

  }

  return (
    <div className="text-white flex flex-col h-screen">
      <div className="bg-gray-800 py-4 px-6">
        <h1 className="text-2xl font-bold">My App</h1>
        <div className="flex">
        </div>
      </div>
      <div className="flex-1 flex flex-row">
        <div className="bg-gray-800 w-1/5 p-4">
          <FormControl>
            <FormLabel>Request Match Criterea</FormLabel>
            <Input type='text' onChange={(e) => setMatchTargets(e.target.value.split(', '))} value={matchTargets.join(', ')} />
            <FormHelperText>Match Request Payloads</FormHelperText>
          </FormControl>
        </div>
        <div className="bg-gray-700 w-1/2 p-4">
          {HAR_Inspector({
            title: 'First HAR', handleEditorChange: handleFirstEditorChange, value: firstCode, startingCode, requests: v1_requests, matches, matchTargets, onPasteClick: async () => {
              try {
                const text = await navigator.clipboard.readText();
                setFirstCode(text);
              } catch (err) {
                console.error('Failed to read clipboard text: ', err);
              }
            }
          })}
        </div>
        <div className="bg-gray-600 w-1/2 p-4">
          {HAR_Inspector({
            title: 'Second HAR', handleEditorChange: handleSecondEditorChange, value: secondCode, startingCode, requests: v2_requests, matches, matchTargets, onPasteClick: async () => {
              try {
                const text = await navigator.clipboard.readText();
                setSecondCode(text);
              } catch (err) {
                console.error('Failed to read clipboard text: ', err);
              }
            }
          })}
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

function HAR_Inspector({ title, handleEditorChange, value, startingCode, requests, matches, matchTargets, onPasteClick }) {
  console.log(requests);
  const paths = getCommonAndUniqueStrings(requests.map(request => new URL(request.url).pathname));
  return <div className="flex flex-col">
    <div className=" p-4">
      <Accordion allowMultiple>
        <AccordionItem border='0px'>
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
        {/* <AccordionItem border='0px'>
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
        </AccordionItem> */}
      </Accordion>
    </div>
    <div className=" p-4 py-2">

      <button class="h-7 text-sm bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded flex items-center" onClick={e => onPasteClick()} >
        {PasteIcon()} <span className='mx-1'>Paste HAR</span>
      </button>
    </div>
    <div className=" p-4 py-2">
      <h2 className="px-4 text-lg font-bold">Inspection</h2>
      <Accordion allowMultiple>
        {requests?.map((request, i) => <AccordionItem key={i} border='0px'>
          <div className='request-box p-1 border border-gray-500 m-1 rounded-md'
            style={{
              backgroundColor: matches[createMatchKey(request, matchTargets)] || ''
            }}
          >
            <AccordionButton>
              <Box as="span" flex='1' textAlign='left'>
                <div className='text-sm fle items-center '>
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
                  <div className="m-1 inline-block bg-gray-800 text-gray-300 font-mono text-sm px-2 py-1 rounded">
                    {jsonToMinimalString(ueFDOrQS(request))}
                    {/* {JSON.stringify(matches[createMatchKey(request, matchTargets)]?.color)} */}
                  </div>
                </div>
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </div>
          <AccordionPanel pb={4}>
            <Tabs>
              <TabList>
                <Tab>Request</Tab>
                <Tab>Response</Tab>
                <Tab>Headers</Tab>
                <Tab>All</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <ReactJson indentWidth={2} name={false} collapsed={1} src={request?.request || {}} theme='hopscotch' />

                </TabPanel>
                <TabPanel>
                  <ReactJson indentWidth={2} name={false} collapsed={1} src={request?.body || {}} theme='hopscotch' />

                </TabPanel>
                <TabPanel>
                  <ReactJson indentWidth={2} name={false} collapsed={1} src={request?.headers || {}} theme='hopscotch' />

                </TabPanel>
                <TabPanel>
                  <ReactJson indentWidth={2} name={false} collapsed={1} src={request} theme='hopscotch' />

                </TabPanel>
              </TabPanels>
            </Tabs>
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
    <div className={`text-xs inline-block rounded-full px-1 text-white font-bold ${bgColor}`}>
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
    fontSize: '10px',
    padding: '2px',
    borderRadius: '9999px',
    display: 'inline-block'
  };

  return (
    <div className='text-xs' title={text} style={style}>
      {text.toUpperCase().replace(/[^\w\s]/gi, '').slice(0, 2)}
    </div>
  );
}
function getHexColorFromText(text) {
  const color = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 0xffffff;
  return `#${color.toString(16).padStart(6, '0')}`;
}



function findMatches(requests1, requests2, matchTargets) {
  const matches = {};
  const existingColors = [];

  requests1.forEach((req1) => {
    requests2.forEach((req2) => {

      const reqPayload1 = ueFDOrQS(req1);
      const reqPayload2 = ueFDOrQS(req2);

      const v1_url = new URL(req1.url);
      const v2_url = new URL(req2.url);

      // compare the matchTargets that are part of reqPayload

      const matched = matchTargets.every((target) => {
        return reqPayload1[target] === reqPayload2[target];
      });

      const matchKey = createMatchKey(req1, matchTargets);

      if (v1_url.hostname === v2_url.hostname && v1_url.pathname === v2_url.pathname && matched) {
        // const matchColor = generateNewDarkColor(existingColors);
        // existingColors.push(matchColor);
        // matches.push([matchColor, req1, req2]);
        matches[matchKey] = matches[matchKey] ? matches[matchKey] : generateNewDarkColor(existingColors);

        // matches[matchKey] = {
        //   color: matches[matchKey] ? matches[matchKey] : generateNewDarkColor(existingColors),
        //   requests: insertIfNotExists(matches[matchKey]?.requests || [], [
        //     req1, req2
        //   ], (req) => {
        //     return matches[matchKey]?.requests?.find(r => r.uuid === req.uuid);
        //   })
        // }
      }
    });
  });
  console.log({ matches });
  return matches;
}

const insertIfNotExists = (arr, elements, predicate) => {
  const existingElements = arr.filter(predicate);
  const newElements = elements.filter((element) => !predicate(element));
  const insertIndex = arr.indexOf(existingElements[0]) + 1;

  return [
    ...arr.slice(0, insertIndex),
    ...newElements,
    ...arr.slice(insertIndex)
  ];
};

function createMatchKey(req, matchTargets) {
  const reqPayload = ueFDOrQS(req);
  const url = new URL(req.url);
  const keyParts = [url.hostname, url.pathname];

  matchTargets.forEach((target) => {
    keyParts.push(reqPayload[target]);
  });

  return keyParts.join('|');
}



const darkishColors = [
  '#2c3e50',
  '#34495e',
  '#7f8c8d',
  '#95a5a6',
  '#bdc3c7',
  '#7f8c8d',
  '#2c3e50',
  '#34495e',
  '#95a5a6',
  '#bdc3c7',
  '#2c3e50',
  '#34495e',
  '#7f8c8d',
  '#95a5a6',
  '#bdc3c7',
  '#2c3e50',
  '#34495e',
  '#7f8c8d',
  '#95a5a6',
  '#bdc3c7'
];

function generateNewDarkColor(existingColors) {
  let newColor = '';
  do {
    newColor = generateDarkishColor();
  } while (existingColors.includes(newColor));
  return newColor;
}

function generateDarkishColor() {
  return generateRandomColorInRange(50, 150);
}

function generateRandomColorInRange(minLuminance, maxLuminance) {
  const luminance = Math.floor(Math.random() * (maxLuminance - minLuminance + 1)) + minLuminance;
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  const color = `#${hex.padStart(6, '0')}`;
  return adjustLuminance(color, luminance);
}

function adjustLuminance(color, luminance) {
  const hex = color.slice(1);
  const rgb = hex.match(/.{1,2}/g).map((c) => parseInt(c, 16));
  const hsl = rgbToHsl(...rgb);
  hsl[2] = luminance / 255;
  const newRgb = hslToRgb(...hsl);
  const newHex = newRgb.map((c) => c.toString(16).padStart(2, '0')).join('');
  return `#${newHex}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const PasteIcon = () => <svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16,8.00100238 L10.5,8.00100238 C9.67157288,8.00100238 9,8.67257525 9,9.50100238 L9,18.5010024 C9,19.3294295 9.67157288,20.0010024 10.5,20.0010024 L17.5,20.0010024 C18.3284271,20.0010024 19,19.3294295 19,18.5010024 L19,11.0010024 L16.5,11.0010024 C16.2238576,11.0010024 16,10.7771448 16,10.5010024 L16,8.00100238 Z M20,10.5289799 L20,18.5010024 C20,19.8817143 18.8807119,21.0010024 17.5,21.0010024 L10.5,21.0010024 C9.11928813,21.0010024 8,19.8817143 8,18.5010024 L8,9.50100238 C8,8.1202905 9.11928813,7.00100238 10.5,7.00100238 L16.4720225,7.00100238 C16.6047688,6.99258291 16.7429463,7.03684187 16.8535534,7.14744899 L19.8535534,10.147449 C19.9641605,10.2580561 20.0084195,10.3962336 20,10.5289799 Z M17,10.0010024 L18.2928932,10.0010024 L17,8.70810916 L17,10.0010024 Z M11.5,13 C11.2238576,13 11,12.7761424 11,12.5 C11,12.2238576 11.2238576,12 11.5,12 L16.5,12 C16.7761424,12 17,12.2238576 17,12.5 C17,12.7761424 16.7761424,13 16.5,13 L11.5,13 Z M11.5,15 C11.2238576,15 11,14.7761424 11,14.5 C11,14.2238576 11.2238576,14 11.5,14 L16.5,14 C16.7761424,14 17,14.2238576 17,14.5 C17,14.7761424 16.7761424,15 16.5,15 L11.5,15 Z M11.5,17 C11.2238576,17 11,16.7761424 11,16.5 C11,16.2238576 11.2238576,16 11.5,16 L15.5,16 C15.7761424,16 16,16.2238576 16,16.5 C16,16.7761424 15.7761424,17 15.5,17 L11.5,17 Z M13.5,4 C13.2238576,4 13,3.77614237 13,3.5 C13,3.22385763 13.2238576,3 13.5,3 C14.8807119,3 16,4.11928813 16,5.5 L16,7 C16,7.27614237 15.7761424,7.5 15.5,7.5 C15.2238576,7.5 15,7.27614237 15,7 L15,5.5 C15,4.67157288 14.3284271,4 13.5,4 Z M6.5,3 C6.77614237,3 7,3.22385763 7,3.5 C7,3.77614237 6.77614237,4 6.5,4 C5.67157288,4 5,4.67157288 5,5.5 L5,14.5 C5,15.3284271 5.67157288,16 6.5,16 L8,16 C8.27614237,16 8.5,16.2238576 8.5,16.5 C8.5,16.7761424 8.27614237,17 8,17 L6.5,17 C5.11928813,17 4,15.8807119 4,14.5 L4,5.5 C4,4.11928813 5.11928813,3 6.5,3 Z M9,3.5 C9,3.77614237 8.77614237,4 8.5,4 C8.22385763,4 8,3.77614237 8,3.5 C8,2.67157288 8.67157288,2 9.5,2 L10.5,2 C11.3284271,2 12,2.67157288 12,3.5 C12,3.77614237 11.7761424,4 11.5,4 C11.2238576,4 11,3.77614237 11,3.5 C11,3.22385763 10.7761424,3 10.5,3 L9.5,3 C9.22385763,3 9,3.22385763 9,3.5 Z"></path> </g></svg>