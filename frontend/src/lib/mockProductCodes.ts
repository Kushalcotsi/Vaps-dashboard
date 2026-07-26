export const UNIT_TYPES = ["Glo", "Cold", "Flex", "Brm", "Container", "Trailer", "Complexes", "Redi Plex", "Sales Offices"];

export const MOCK_PRODUCT_CODES: Record<string, string[]> = {
  Glo: [
    "20W", "40W", "10W", "18W", "25W", "30W", "HQ208", "HQ408", "20X", "40U"
  ],
  Cold: [
    "10CR3", "10CR1HC", "20CR1HC", "20CR3", "20CR1HC COMBO", "30CR1HC", "40CR3HC", 
    "40CR3HCR", "28TRD", "28TRH", "28TRE", "36TRMH", "36TRMD", "48TRMH", "53TRMD", 
    "53TRMH", "53TRH", "53TRD", "53TRE", "53TRDSD", "53TRESD", "53TRHSD", "12TRE", 
    "CSCPXDEN", "20F2", "40F2"
  ],
  Flex: [
    "P1208", "P12016", "P12024", "P12032", "P12040", "P12048", "P12056", "P12064", 
    "P12072", "P12080", "P1408", "P14016", "P14024", "P14032", "P14040", "P14048", 
    "P14056", "P14064", "P14072", "P14080", "P22016", "P22024", "P22032", "P22040", 
    "P22048", "P22056", "P22064", "P22072", "P22080", "P24016", "P24024", "P24032", 
    "P24040", "P24048", "P24056", "P24064", "P24072", "P24080", "P32024", "P32032", 
    "P32040", "P32048", "P32056", "P32064", "P32072", "P32080", "P34024", "P34032", 
    "P34040", "P34048", "P34056", "P34064", "P34072", "P34080"
  ],
  Brm: [
    "BR6024", "BR6036", "BR4024", "BR4036", "BR408", "BR409", "BR6012", "BR208", 
    "BR2012", "BR4012", "BR4412", "BR4014", "BR4048", "BR4060", "BR40108", "BR4028", 
    "BR4040", "BR4052", "BR4064", "BR4072", "BR4076", "BR4084", "BR4088", "BR4096", 
    "BR40100", "BR40112", "BR40120", "BR40124", "BR40132", "BR40136", "BR40144", 
    "BR40148", "BR40156", "BR40160", "BR40168", "BR40172", "BR40180", "BR40184", 
    "BR40192", "BR40196", "BR6048", "BR6060", "BR6072", "BR6084", "BR6096", "BR60108", 
    "BR60120", "BR60132", "BR60144", "BR24012", "BR24024", "BR24028", "BR24036", 
    "BR24040", "BR24048", "BR24052", "BR24060", "BR24064", "BR24072", "BR24076", 
    "BR26012", "BR26024", "BR24084", "BR24088", "BR24096", "BR240100", "BR240108", 
    "BR240112", "BR240120", "BR240124", "BR240132", "BR240136", "BR240144", "BR240148", 
    "BR408TR", "BR4012TR", "BR2012GH", "BR4012RR"
  ],
  Container: [
    "40WS", "20WS", "40ZS", "20ZS", "40ZK", "40S6", "25ZJ", "10S", "20ZK", 
    "10ZS", "25ZK", "20ZI", "15ZS", "15S", "18ZI", "40ZST", "25S", "15ZI", 
    "40ZI", "10ZI", "25ZS", "25ZI", "45VT", "40ZKT", "40ZIT", "20FPH", 
    "53TRDRY", "SV348", "40F", "40ZF", "10ZK", "20K6", "15ZK", "27VT", 
    "12PV", "23PV", "53CT3"
  ],
  Trailer: [
    "MO248", "MO328", "MO3610", "MO4410", "MO4412", "MO5010", "MO5012", "MO5014", 
    "MO6012", "MO7414"
  ],
  Complexes: [
    "SM2824", "SM3424", "SM3624", "SM4420", "SM3824", "SM4024", "SM3628", "SM4224", 
    "SM4424", "SM3928", "SM4624", "SM4824", "SM5024", "SM4328", "SM4428", "SM5224", 
    "SM4828", "SM5324", "SM5424", "SM5624", "SM5824", "SM5924", "SM5128", "SM5428", 
    "SM5628", "SM5928", "SM6220", "SM6024", "SM6124", "SM6224", "SM6424", "SM6624", 
    "SM6724", "SM6824", "SM6924", "SM7024", "SM6028", "SM7224", "SM6228", "SM6328", 
    "SM7424", "SM6828", "SM6428", "SM7624", "SM7824", "SM6628", "SM6032", "SM8024", 
    "SM7028", "SM7228", "SM8424", "SM7428", "SM7628", "SM7828", "SM8028", "SM8428", 
    "SM4436", "SM4836", "SM4936", "SM5236", "SM5436", "SM6036", "SM6236", "SM5442", 
    "SM6436", "SM6736", "SM6836", "SM6042", "SM7036", "SM7236", "SM7436", "SM6442", 
    "SM7636", "SM6642", "SM7836", "SM6842", "SM8036", "SM7042", "SM7242", "SM8436", 
    "SM7442", "SM7642", "SM7842", "SM8042", "SM8442", "SM4440", "SM4848", "SM5148", 
    "SM5248", "SM6048", "SM6448", "SM6648", "SM6748", "SM6848", "SM6056", "SM7048", 
    "SM6256", "SM6456", "SM7648", "SM5648", "SM7748", "SM6856", "SM7848", "SM7056", 
    "SM7256", "SM7456", "SM7656", "SM8056", "SM7670", "SM7264", "SM7270", "SM8070", 
    "SM6860", "SM6060", "SM6070", "SM7470", "SM6470", "SM5770", "SM6460", "SM4472", 
    "SM7472", "SM6872", "SM6072", "SM7272", "SM5472", "SM7072", "SM6472", "SM6884", 
    "SM8498", "SM6498", "SM7298", "SM6484", "SM6084", "SM64112", "SM72112", "SM68112", 
    "SM74112", "SM60112", "SM6496", "SM6096", "SM60108", "SM60120", "SM60126", 
    "SM60144", "SM64108", "SM64120", "SM64126", "SM64132", "SM64140", "SM64144", 
    "SM64156", "SM64168", "SM64180", "SM64192", "SM64204", "SM64216", "SM66238", 
    "SM70140", "SM74126", "SM74144", "SM74196", "SM76108"
  ],
  "Redi Plex": [
    "RP6024", "RP6036", "RP6048", "RP6060", "RP6072", "RP6084", "RP6096", "RP60108", 
    "RP60120", "RP60132", "RP60144", "RP60156", "RP60168", "RP60180", "RP64192", 
    "RP60216", "RP64240", "RP64264"
  ],
  "Sales Offices": [
    "SO4812", "SO5460", "SO6012", "SO328", "SO6436", "SO6448", "SO6472", "SO6496", 
    "SO4824", "SO6024", "SO6028", "SO6036"
  ]
};

export function getDynamicProductCodes(unitType: string, availableCodes: Set<string>): {
  withData: string[];
  withoutData: string[];
  validCodesForType: string[];
} {
  const hardcodedForType = MOCK_PRODUCT_CODES[unitType] || [];
  
  // Find all hardcoded codes across all unit types
  const allHardcodedCodes = new Set<string>();
  Object.values(MOCK_PRODUCT_CODES).forEach((list) => {
    list.forEach((code) => allHardcodedCodes.add(code));
  });

  // Find any extra codes in availableCodes from Snowflake that are NOT in any hardcoded list
  const extraSnowflakeCodes: string[] = [];
  availableCodes.forEach((code) => {
    if (!allHardcodedCodes.has(code)) {
      extraSnowflakeCodes.push(code);
    }
  });

  const withData: string[] = [];
  const withoutData: string[] = [];

  // 1. Check hardcoded codes for this unit type
  hardcodedForType.forEach((code) => {
    if (availableCodes.has(code)) {
      withData.push(code);
    } else {
      withoutData.push(code);
    }
  });

  // 2. Add extra codes from Snowflake to withData so they are always visible & clickable
  extraSnowflakeCodes.forEach((code) => {
    withData.push(code);
  });

  const sortedWithData = Array.from(new Set(withData)).sort();
  const sortedWithoutData = Array.from(new Set(withoutData)).sort();

  return {
    withData: sortedWithData,
    withoutData: sortedWithoutData,
    validCodesForType: [...sortedWithData, ...sortedWithoutData],
  };
}
