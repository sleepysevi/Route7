/**
 * One-off fixer: updates the "via", "stops" (and contradicting "route" labels)
 * in data/routes.json for routes audited against KML-derived
 * data/route-descriptions.json. Preserves the file's compact 2-line format
 * and CRLF endings. Fields not listed here are left untouched.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'routes.json');

// code -> { route?, via, stops }
const FIXES = {
  // ---- Category A: wrong / copy-pasted, fully regenerated ----
  '01B': {
    route: 'Sambag 1 - Pier 2/3 (via Colon St.)',
    via: 'E-Mall, Colon St, T. Padilla St',
    stops: ['Sambag 1 (USC South Campus)', 'E-Mall (ACT)', 'Colon St', 'T. Padilla St', 'Pier 4', 'Pier 3', 'Pier 2'],
  },
  '01C': {
    route: 'V. Rama Ave - Pier 3',
    via: 'Colon St, T. Padilla St, E-Mall',
    stops: ['V. Rama Ave', 'Colon St', 'Zulueta St', 'T. Padilla St', 'Pier 4', 'Pier 3', 'E-Mall (Sanciangko St.)'],
  },
  '02B': {
    route: 'South Bus Terminal - Pier 4 (via Colon St.)',
    via: 'Plaza Independencia, Colon St, Pier Area',
    stops: ['South Bus Terminal', 'Plaza Independencia', 'Colon St', 'Pier 2', 'Pier 3', 'Pier 4'],
  },
  '03A': {
    route: 'Panagdait (Mabolo) - Carbon Market',
    via: 'M.J. Cuenco Ave, Manalili St',
    stops: ['Panagdait (Mabolo)', 'M.J. Cuenco Ave', 'Manalili St', 'Carbon Market'],
  },
  '03B': {
    route: 'Mabolo - Colon (via Jones Ave.)',
    via: 'Mango Ave, Fuente Osmeña, Jones Ave',
    stops: ['Mabolo (Sindulan)', 'Mango Ave', 'Fuente Osmeña', 'Jones Ave', 'Osmeña Blvd', 'Metro Colon', 'Colon St'],
  },
  '03L': {
    route: 'Mabolo (Luyo) - Carbon Market',
    via: 'Cabantan St, Metro Colon, Manalili St',
    stops: ['Mabolo (Luyo)', 'Cabantan St', 'Metro Colon', 'Sto. Niño (Manalili St.)', 'Carbon Market'],
  },
  '06B': {
    route: 'Guadalupe - Carbon Market',
    via: 'M. Velez St, Capitol, Jones Ave',
    stops: ['Guadalupe Church', 'Fooda Guadalupe / PRC', 'M. Velez St', 'Provincial Capitol', 'Jones Ave', 'Fuente Osmeña', 'Robinsons Fuente', 'Abellana Sports Complex', 'Metro Colon (USJ-R)', 'Carbon Market', 'Basilica del Sto. Niño'],
  },
  '06C': {
    route: 'Guadalupe - Colon (via B. Rodriguez St.)',
    via: 'V. Rama Ave, B. Rodriguez St, Fuente Osmeña',
    stops: ['Guadalupe Church', 'V. Rama Ave', 'B. Rodriguez St', 'Vicente Sotto Hospital', 'Fuente Osmeña', 'Robinsons Fuente', 'Crown Regency', 'Osmeña Blvd', 'Colon St', 'Carbon Market', 'Basilica del Sto. Niño'],
  },
  '06G': {
    route: 'Guadalupe - C. Padilla St.',
    via: 'Katipunan St, Tres de Abril, C. Padilla St',
    stops: ['Guadalupe Church', 'Calamba', 'Katipunan St', 'Labangon', 'Tres de Abril St.', 'Taboan Market', 'Pasil', 'C. Padilla St.'],
  },
  '06H': {
    route: 'Guadalupe - SM City Cebu',
    via: 'V. Rama Ave, N. Escario St, Ayala Center',
    stops: ['Guadalupe Church', 'V. Rama Ave (Corner Banawa)', 'Provincial Capitol', 'Jones Ave (Cebu Doctors University)', 'N. Escario St', 'Philhealth', 'Ayala Center Cebu', 'Cabantan St', 'Juan Luna Ave (Mabolo)', 'Mabolo Church', 'SM City Cebu'],
  },
  '09G': {
    route: 'Basak-Ibabao - Colon (Basilica)',
    via: 'Mambaling, C. Padilla St, Taboan Market',
    stops: ['Basak-Ibabao (Quiot)', 'Mambaling', 'C. Padilla St.', 'Pasil', 'Taboan Market', 'Colon St', 'USJ-R', 'Carbon Market', 'Magallanes St', 'Basilica del Sto. Niño'],
  },
  '10G': {
    route: 'Pardo (Bulacao) - Magallanes (Basilica)',
    via: 'Basak, Mambaling, C. Padilla St',
    stops: ['Pardo (Bulacao)', 'Basak', 'Mambaling', 'C. Padilla St.', 'Pasil', 'Taboan Market', 'Colon St', 'USJ-R', 'Carbon Market', 'Magallanes St (Basilica del Sto. Niño)'],
  },
  '11A': {
    route: 'Inayawan - Colon (Basilica)',
    via: 'C. Padilla St, Carbon Market, Magallanes St',
    stops: ['Inayawan', 'C. Padilla St.', 'Magallanes St', 'Carbon Market', 'Basilica del Sto. Niño', 'Colon St'],
  },
  '12D': {
    route: 'Labangon - Colon (via Tres de Abril St.)',
    via: 'Tisa, Tres de Abril St, E-Mall',
    stops: ['Labangon (Katipunan St.)', 'Tisa', 'Punta Princesa', 'Tres de Abril St.', 'E-Mall', 'USC Main', 'UV (Colon)', 'Cathedral', 'Colonnade'],
  },
  '12G': {
    route: 'SM City Cebu - Labangon (via Katipunan St.)',
    via: 'T. Padilla St, E-Mall, Katipunan St',
    stops: ['SM City Cebu', 'Pier 4', 'T. Padilla St', 'Sanciangko St', 'E-Mall', 'CCMC', 'Labangon', 'Katipunan St', 'Tisa', 'Punta Princesa'],
  },
  '12I': {
    route: 'SM City Cebu - Labangon (via Tres de Abril St.)',
    via: 'Plaza Independencia, Manalili St, Tres de Abril',
    stops: ['SM City Cebu', 'Pier 3', 'Pier 4', 'Plaza Independencia', 'Legaspi St', 'Cathedral (Sto. Niño)', 'Manalili St', 'CCMC', 'N. Bacalso Ave (Hi-way)', 'Labangon (Tres de Abril)', 'Punta Princesa'],
  },
  '13C': {
    route: 'Talamban - Colon',
    via: 'Banilad, Ayala Center, Gorordo Ave',
    stops: ['Talamban', 'Gov. M. Cuenco Ave', 'Banilad (Gaisano Country Mall)', 'UC Banilad', 'Arch. Reyes Ave', 'Ayala Center Cebu', 'Gorordo Ave', 'Gen. Echavez St', 'Sikatuna St', 'Parian', 'Colon St', 'Colonnade (UV)'],
  },
  '13H': {
    route: 'Pit-os - Mandaue Public Market (via A.S. Fortuna St.)',
    via: 'Banilad, A.S. Fortuna St, J Centre Mall',
    stops: ['Pit-os', 'Bacayan', 'Talamban', 'San Carlos (UV Banilad)', 'Foodland', 'A.S. Fortuna St.', 'J Centre Mall', 'Hi-way', 'Centro Mandaue', 'Mandaue Public Market'],
  },
  '14D': {
    route: 'Ayala Terminal - Colon (via Capitol)',
    via: 'N. Escario St, Fuente Osmeña, Colon St',
    stops: ['Ayala Terminal', 'N. Escario St', 'Provincial Capitol', 'Osmeña Blvd', 'Fuente Osmeña', 'Robinsons Fuente', 'F. Ramos St', 'Cogon Ramos', 'USC Main (Junquera St.)', 'Colon St', 'Gaisano Main (UV)', 'Manalili St'],
  },
  '17B': {
    route: 'Apas (IT Park) - Carbon Market',
    via: 'JY Square, Capitol, Fuente Osmeña',
    stops: ['Apas (IT Park)', 'JY Square (Lahug)', 'Capitol Site', 'Fuente Osmeña', 'Colon St', 'Carbon Market'],
  },
  '17C': {
    route: 'Apas (IT Park) - Carbon Market (via Gorordo Ave.)',
    via: 'JY Square, Gorordo Ave, Mango Ave',
    stops: ['Apas (IT Park)', 'JY Square (Lahug)', 'Gorordo Ave', 'Mango Ave', 'Ramos St', 'E-Mall', 'Carbon Market', 'Cebu City Hall', 'Sto. Niño (Basilica)'],
  },
  '20B': {
    route: 'Ayala Terminal - Ibabao (Estancia)',
    via: 'Mabolo, Subangdaku, Maguikay Flyover',
    stops: ['Ayala Terminal', 'Cebu Business Park', 'Mabolo', 'Subangdaku', 'Tipolo', 'San Miguel Brewery', 'Maguikay Flyover', 'Ibabao (Estancia)', 'Mandaue Coliseum', 'Centro Mandaue', 'Guizo'],
  },
  '22A': {
    route: 'Metropolitan Cathedral - Ouano (Mandaue)',
    via: 'Mabolo, Merkado, BIR Mandaue',
    stops: ['Metropolitan Cathedral', 'Mabolo', 'Hi-way', 'Merkado (Mandaue Public Market)', 'BIR Mandaue', 'Ouano'],
  },
  '22D': {
    route: 'Metropolitan Cathedral - Ouano (Mandaue)',
    via: 'SM City Cebu, Centro Mandaue, Ouano',
    stops: ['Metropolitan Cathedral', 'SM City Cebu', 'Wireless', 'Mandaue', 'Centro Mandaue', 'Mandaue Public Market', 'Ouano'],
  },
  '22G': {
    route: 'Metropolitan Cathedral - Ouano (Mandaue)',
    via: 'SM City Cebu, T. Padilla St, Wireless',
    stops: ['Metropolitan Cathedral', 'SM City Cebu', 'T. Padilla St', 'North Bus Terminal', 'Wireless', 'CICC', 'Colonnade Mandaue', 'Merkado', 'Ouano'],
  },
  '22I': {
    route: 'Country Mall (Banilad) - Mandaue Public Market',
    via: 'A.S. Fortuna St, J Centre Mall, Mantuyong',
    stops: ['Country Mall (Banilad)', 'A.S. Fortuna St.', 'J Centre Mall', 'Mantuyong', 'Sioland', 'Colonnade Mandaue', 'Mandaue Public Market (Merkado)', 'Bureau of Immigration', 'Mandaue City Hall'],
  },
  '23': {
    route: 'Parkmall (Mandaue) - Punta Engaño',
    via: 'Pusok, MEPZ 1, Marina Mall',
    stops: ['Parkmall (Mandaue)', 'Umapad', 'New Mactan-Mandaue Bridge', 'Pusok', 'MEPZ 1', 'Marina Mall', 'Mactan Shrine', 'Shangri-La Mactan', 'Punta Engaño'],
  },
  '23D': {
    route: 'Opon (Lapu-Lapu) - Mandaue',
    via: 'UC-LM, Guizo, Parkmall',
    stops: ['Opon (Lapu-Lapu)', 'UC-LM', 'Hi-way (Mandaue)', 'Guizo', 'CICC', 'Parkmall', 'S&R Shopping', 'Cebu Doctors University'],
  },
  '62B': {
    route: 'Pit-os - Carbon Market',
    via: 'Talamban, Country Mall, Ayala Center',
    stops: ['Pit-os', 'Talamban', 'Gaisano Country Mall (Banilad)', 'Ayala Center Cebu', 'Gorordo Ave', 'Gen. Echavez St', 'Manalili St', 'Carbon Market', 'Sto. Niño (Basilica)'],
  },
  'MI-01A': {
    route: 'Punta Engaño - Opon Public Market',
    via: 'Marina Mall, Pusok, Gaisano Mactan',
    stops: ['Punta Engaño', 'MEPZA', 'Marina Mall', 'Pusok', 'Lapu-Lapu City Hall', 'Gaisano Mactan (Island Mall)', 'Metro Mactan', 'Opon Public Market'],
  },
  'MI-02B': {
    route: 'Parkmall (Mandaue) - Maribago',
    via: 'Highland, Pusok, MEPZ 1',
    stops: ['Parkmall (Mandaue)', 'S&R Membership Shopping', 'Cebu Doctors University', 'CICC', 'New Mandaue Public Market', 'Highland', 'New Mactan-Mandaue Bridge', 'Pusok', 'Marina Mall', 'MEPZ 1 (Gates 1-5)', 'Ibo', 'Mactan', 'Maribago'],
  },
  'MI-03A': {
    route: 'Cordova - Lapu-Lapu City Public Market',
    via: 'Babag, Looc, Deca Homes',
    stops: ['Cordova', 'Babag 1', 'Babag 2', 'Deca Homes', 'Looc', 'Yanadia', 'Lapu-Lapu City Public Market (Opon)'],
  },
  'MI-03B': {
    route: 'Cordova - MEPZ 1 (via Opon Public Market)',
    via: 'Opon Public Market, Gaisano Mactan, Marina Mall',
    stops: ['Cordova', 'Babag 1', 'Babag 2', 'Looc', 'Lapu-Lapu Public Market', 'Opon Public Market', 'Gaisano Mactan (Island Mall)', 'Pusok', 'Marina Mall (Savemore)', 'MEPZ 1 (Gates 1-4)'],
  },
  'MI-04A': {
    route: 'Tamiya Terminal (MEPZ 2) - Mandaue',
    via: 'Robinsons Mactan, UCLM, Parkmall',
    stops: ['Tamiya Terminal (MEPZ 2)', 'Robinsons Supermarket Mactan', 'UCLM', 'Parkmall', 'Cebu Doctors University', 'MO2', 'Mandaue'],
  },
  'MI-04B': {
    route: 'Tamiya Terminal (MEPZ 2) - MEPZ 1',
    via: 'Gaisano Mactan, Pusok, Marina Mall',
    stops: ['Tamiya Terminal (MEPZ 2)', 'Crown Regency Suites', 'Gaisano Mactan (Island Mall)', 'Lapu-Lapu City Hall', 'SSS', 'Pusok', 'Marina Mall (Savemore Mactan)', 'MEPZ 1'],
  },
  'MI-05A': {
    route: 'Mactan Airport - Opon (Muelle Osmeña Port)',
    via: 'Marina Mall, Gaisano Mactan, Ferry Boat Port',
    stops: ['Mactan Airport', 'Marina Mall', 'Pusok', 'Lapu-Lapu City Hall', 'Gaisano Mactan (Island Mall)', 'General Milling Corp.', 'Opon Parish Church', 'Ferry Boat Port (Muelle Osmeña)'],
  },

  // ---- Category B: partially matched, corrected ----
  '10F': {
    route: 'Bulacao - Colon (via Citilink)',
    via: 'Pardo, Basak, Mambaling, Citilink',
    stops: ['Bulacao Terminal', 'Pardo', 'Basak', 'Mambaling', 'CIT-U', 'Cor. V. Rama Ave (Citilink)', 'CCMC', 'South Bus Terminal', 'E-Mall', 'USC Main (Junquera St.)', 'Colon St (Metro Gaisano)'],
  },
  '04B': {
    route: 'Lahug (Campo) - Carbon Market',
    via: 'JY Square, Capitol, Fuente Osmeña',
    stops: ['Lahug Terminal (Campo)', 'JY Square Mall', 'Capitol Site', 'Fuente Osmeña', 'Colon St', 'Carbon Market'],
  },
  '04C': {
    route: 'Lahug - Carbon Market (via Mango Ave.)',
    via: 'Gorordo Ave, Mango Ave, Junquera St',
    stops: ['Lahug (Cor. Sudlon)', 'JY Square Mall', 'UP Cebu', 'Gorordo Ave', 'Mango Ave', 'Robinsons Fuente', 'F. Ramos St', 'USC Main (Junquera St.)', 'E-Mall', 'Carbon Market'],
  },
  '04D': {
    route: 'Plaza Housing (Busay) - Carbon Market (via Taboan)',
    via: 'JY Square, Escario St, Taboan Market',
    stops: ['Plaza Housing (Busay)', 'JY Square Mall', 'N. Escario St', 'Fuente Osmeña', 'Sanciangko St', 'Taboan Market', 'Carbon Market'],
  },
  '04H': {
    route: 'Plaza Housing (Busay) - Carbon Market',
    via: 'Busay, JY Square, Capitol',
    stops: ['Plaza Housing (Busay)', 'Busay', 'JY Square Mall', 'Capitol Site', 'Fuente Osmeña', 'Robinsons Fuente', 'E-Mall', 'Carbon Market'],
  },
  '04I': {
    route: 'Plaza Housing (Busay) - Carbon Market (via Mango Ave.)',
    via: 'Gorordo Ave, Mango Ave, E-Mall',
    stops: ['Plaza Housing (Busay)', 'Busay', 'JY Square Mall', 'Gorordo Ave', 'Mango Ave', 'Robinsons Fuente', 'Ramos St', 'E-Mall', 'Carbon Market'],
  },
  '07B': {
    route: 'Banawa - Carbon Market',
    via: 'V. Rama, Fuente Osmeña, Colon St',
    stops: ['Banawa Terminal', 'V. Rama Ave', 'Fuente Osmeña', 'Robinsons Fuente', 'Colon St', 'USJ-R', 'Carbon Market', 'Basilica del Sto. Niño'],
  },
  '08G': {
    route: 'Alumnos - Colon (Zulueta St.)',
    via: 'C. Padilla St, Pasil, Colon St',
    stops: ['Alumnos', 'Tagunol St.', 'C. Padilla St.', 'Pasil', 'San Nicolas Parish', 'Colon St', 'Metro Colon (Colonnade)', 'Gaisano Main (UV)', 'Zulueta St'],
  },
  '09C': {
    route: 'Brgy. Quiot (Basak) - Metropolitan Cathedral',
    via: 'Mambaling, Citilink, E-Mall',
    stops: ['Brgy. Quiot (Basak/Ibabao)', 'Sabellano St.', 'Basak', 'Mambaling', 'CIT-U', 'Citilink Terminal', 'South Bus Terminal', 'E-Mall', 'USC Main', 'Sikatuna St', 'Colon Obelisk', 'Metropolitan Cathedral'],
  },
  '12L': {
    route: 'Labangon - Ayala Center Cebu',
    via: 'V. Rama Ave, Fuente Osmeña, Mango Ave',
    stops: ['Labangon', 'V. Rama Ave', 'B. Rodriguez St', 'Fuente Osmeña', 'Robinsons Fuente', 'Vicente Sotto Hospital', 'Mango Ave', 'Mango Square', 'Cebu Business Park', 'Ayala Center Cebu (Terminal)'],
  },
  '13B': {
    route: 'Talamban - Carbon Market (via Ramos St.)',
    via: 'Banilad, Ayala Center, Ramos St',
    stops: ['Talamban', 'Banilad (Country Mall)', 'Ayala Center Cebu', 'Gov. M. Cuenco Ave', 'Gen. Echavez St', 'Ramos St', 'Carbon Market', 'Sto. Niño (Basilica)'],
  },
  '17D': {
    route: 'Apas - Carbon Market (via Taboan)',
    via: 'IT Park, Capitol, Taboan Market',
    stops: ['Apas', 'IT Park', 'JY Square (Lahug)', 'Capitol Site', 'Cebu Doctors Hospital', 'Fuente Osmeña', 'Sanciangko St', 'E-Mall (UC Main)', 'Taboan Market', 'Pasil', 'Carbon Market'],
  },
  '20A': {
    route: 'Ayala Terminal - Mandaue (Parkmall/Pacific Mall)',
    via: 'Mabolo, Parkmall, Mandaue City Hall',
    stops: ['Ayala Terminal', 'Mabolo', 'Subangdaku', 'Wireless', 'Tipolo', 'Parkmall', 'CICC', 'Guizo', 'Centro Mandaue', 'Mandaue Public Market', 'Mandaue City Hall', 'Mandaue Coliseum (Estancia)', 'Pacific Mall'],
  },
  '21A': {
    route: 'Metropolitan Cathedral - Pacific Mall (Super Metro Mandaue)',
    via: 'SM City Cebu, Centro Mandaue, Pacific Mall',
    stops: ['Metropolitan Cathedral', 'SM City Cebu', 'North Bus Terminal', 'Centro Mandaue', 'CICC', 'BIR Mandaue', 'Mandaue City Hall', 'Super Metro Mandaue', 'Pacific Mall'],
  },
  '21D': {
    route: 'Metropolitan Cathedral - Super Metro Mandaue',
    via: 'T. Padilla St, SM City Cebu, Mandaue Public Market',
    stops: ['Metropolitan Cathedral', 'Plaza Independencia', 'Pier 3', 'Pier 4', 'T. Padilla St', 'White Gold Club', 'SM City Cebu', 'North Bus Terminal', 'Wireless', 'Tipolo', 'Parkmall', 'CICC', 'Centro Mandaue', 'Mandaue Public Market', 'Mandaue City Hall', 'Super Metro Mandaue'],
  },
  '24': {
    route: 'Consolacion - White Gold (via Highway)',
    via: 'Canduman, Subangdaku, Mabolo',
    stops: ['Consolacion', 'SM Consolacion', 'Canduman', 'Pacific Mall (Basak)', 'Hi-way (Mandaue)', 'Subangdaku', 'Mabolo', 'SM City Cebu', 'White Gold'],
  },
};

const routes = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const out = [];
let changed = 0;

for (const r of routes) {
  const fix = FIXES[r.code];
  if (fix) {
    changed++;
    out.push({ ...r, ...fix });
  } else {
    out.push(r);
  }
}

const unknown = Object.keys(FIXES).filter((c) => !routes.some((r) => r.code === c));
if (unknown.length) {
  console.error('FIX codes not found in routes.json:', unknown.join(', '));
  process.exit(1);
}

// Preserve the file's compact two-line entry format and CRLF endings.
const body = out
  .map((r) =>
    [
      `  { "code": ${JSON.stringify(r.code)}, "color": ${JSON.stringify(r.color)}, "route": ${JSON.stringify(r.route)}, "via": ${JSON.stringify(r.via)}, "group": ${JSON.stringify(r.group)}, "keywords": ${JSON.stringify(r.keywords)},`,
      `    "stops": [${r.stops.map((s) => JSON.stringify(s)).join(', ')}] }`,
    ].join('\r\n')
  )
  .join(',\r\n');

fs.writeFileSync(OUT, `[\r\n${body}\r\n]\r\n`, 'utf8');
console.log(`Updated ${changed} of ${routes.length} routes -> ${OUT}`);
