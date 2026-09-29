// Shared emergency-hotline data. The Hotlines tab renders this with icons,
// and the chatbot's emergency intent returns it directly (plain text API).
export const HOTLINES = [
  {
    group: 'Emergency',
    entries: [
      { name: 'Cebu City Emergency', dept: 'General Emergency Line', number: '911' },
      { name: 'Cebu City Disaster Office', dept: 'CDRRMO — Command Center', number: '(032) 261-8888' },
    ],
  },
  {
    group: 'Police & Safety',
    entries: [
      { name: 'Cebu City Police', dept: 'CCPO — Headquarters', number: '(032) 416-0033' },
      { name: 'Police Emergency', dept: 'Philippine National Police', number: '117' },
      { name: 'NBI Cebu', dept: 'National Bureau of Investigation', number: '(032) 231-1600' },
    ],
  },
  {
    group: 'Fire & Rescue',
    entries: [
      { name: 'Bureau of Fire Protection', dept: 'Cebu City BFP — Station 1', number: '(032) 346-3400' },
      { name: 'Fire Emergency', dept: 'BFP National Hotline', number: '160' },
    ],
  },
  {
    group: 'Medical & Hospitals',
    entries: [
      { name: 'Vicente Sotto Memorial', dept: 'VSMMC — Apex Government Hospital', number: '(032) 253-9891' },
      { name: 'Chong Hua Hospital', dept: 'Fuente Osmeña Campus', number: '(032) 255-8000' },
      { name: "Cebu Doctors' University Hospital", dept: 'Gov. M. Roa St.', number: '(032) 253-7511' },
      { name: 'Red Cross Cebu', dept: 'Philippine Red Cross Chapter', number: '(032) 253-0037' },
    ],
  },
  {
    group: 'Transport & Traffic',
    entries: [
      { name: 'CCTO', dept: 'Cebu City Traffic Operations', number: '(032) 255-1400' },
      { name: 'LTO Cebu', dept: 'Land Transportation Office', number: '(032) 239-5719' },
      { name: 'LTFRB Region 7', dept: 'Franchising & Regulatory Board', number: '(032) 412-6100' },
    ],
  },
  {
    group: 'Utilities',
    entries: [
      { name: 'MCWD', dept: 'Metro Cebu Water District', number: '(032) 239-6339' },
      { name: 'VECO / Visayan Electric', dept: 'Electricity Emergency Line', number: '(032) 230-8326' },
    ],
  },
];
