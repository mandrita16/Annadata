export const STATE_ABBREVIATIONS: Record<string, string> = {
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TS",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
    "Andaman and Nicobar Islands": "AN",
    "Chandigarh": "CH",
    "Dadra and Nagar Haveli": "DD",
    "Daman and Diu": "DD",
    "Delhi": "DL",
    "Jammu and Kashmir": "JK",
    "Ladakh": "LA",
    "Lakshadweep": "LD",
    "Puducherry": "PY",
};

export const MAJOR_CITY_ABBREVIATIONS: Record<string, string> = {
    "MUMBAI": "MUM",
    "DELHI": "DEL",
    "BENGALURU": "BLR",
    "BANGALORE": "BLR",
    "HYDERABAD": "HYD",
    "AHMEDABAD": "AMD",
    "CHENNAI": "CHN",
    "KOLKATA": "KOL",
    "SURAT": "SUR",
    "PUNE": "PUN",
    "JAIPUR": "JAI",
    "LUCKNOW": "LKO",
    "KANPUR": "KNP",
    "NAGPUR": "NAG",
    "INDORE": "IND",
    "THANE": "THA",
    "BHOPAL": "BHO",
    "VISAKHAPATNAM": "VSKP",
    "PATNA": "PAT",
    "VADODARA": "VAD",
    "GHAZIABAD": "GZB",
    "LUDHIANA": "LUD",
    "AGRA": "AGR",
    "NASHIK": "NSK",
    "FARIDABAD": "FBD",
    "MEERUT": "MRT",
    "RAJKOT": "RJT",
    "VARANASI": "VNS",
    "SRINAGAR": "SXR",
    "AURANGABAD": "IXU",
    "DHANBAD": "DBD",
    "AMRITSAR": "ATQ",
    "ALLAHABAD": "IXD",
    "RANCHI": "IXR",
    "HOWRAH": "HWH",
    "COIMBATORE": "CJB",
    "JABALPUR": "JLR",
    "GWALIOR": "GWL",
    "VIJAYAWADA": "VGA",
    "JODHPUR": "JDH",
    "MADURAI": "IXM",
    "RAIPUR": "RPR",
    "KOTA": "KTU",
    "GUWAHATI": "GAU",
    "CHANDIGARH": "IXC",
    "SOLAPUR": "SSE",
    "HUBLI": "HBX",
    "BAREILLY": "BEK",
    "MORADABAD": "MBD",
    "MYSORE": "MYQ",
    "GURGAON": "GUR",
    "ALIGARH": "ALR",
    "JALANDHAR": "JUC",
    "TIRUCHIRAPPALLI": "TRZ",
    "BHUBANESWAR": "BBI",
    "SALEM": "SXV",
    "WARANGAL": "WGC",
    "THIRUVANANTHAPURAM": "TRV",
    "BHIWANDI": "BWD",
    "SAHARANPUR": "SRE",
    "GORAKHPUR": "GOP",
    "BIKANER": "BKB",
    "AMRAVATI": "AMI",
    "NOIDA": "NOI",
    "JAMSHEDPUR": "IXW",
    "BHILAI": "BHL",
    "CUTTACK": "CTC",
    "KOCHI": "COK",
    "UDAIPUR": "UDR",
    "BHAVNAGAR": "BHU",
    "DEHRADUN": "DED",
    "ASANSOL": "ASN",
    "NANDED": "NDC",
    "AJMER": "KQH",
    "JAMNAGAR": "JGA",
    "UJJAIN": "UJN",
    "SILIGURI": "SGU",
    "JHANSI": "JHS",
    "ULHASNAGAR": "ULN",
    "JAMMU": "IXJ",
    "SANGLI": "SGL",
    "MANGALORE": "IXE",
    "ERODE": "ED",
    "BELGAUM": "IXG",
    "KURNOOL": "KJB",
    "AMBATTUR": "AMB",
    "RAJAHMUNDRY": "RJA",
    "TIRUNELVELI": "TEN",
    "MALALEGAON": "MLG",
    "GAYA": "GAY",
};

export function getStateAbbreviation(stateName: string): string {
    if (!stateName) return "XX";
    
    // Normalize string to proper case to match the dictionary keys, or we can just iterate
    const normalized = stateName.trim().toLowerCase();
    
    for (const [key, value] of Object.entries(STATE_ABBREVIATIONS)) {
        if (key.toLowerCase() === normalized) {
            return value;
        }
    }
    
    // Fallback: take first two letters
    const parts = stateName.trim().split(" ");
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return stateName.substring(0, 2).toUpperCase().padEnd(2, "X");
}

export function getCityAbbreviation(cityName: string): string {
    if (!cityName) return "XXX";
    
    const cleanCity = cityName.trim().toUpperCase().replace(/[^A-Z]/g, "");
    
    if (MAJOR_CITY_ABBREVIATIONS[cleanCity]) {
        return MAJOR_CITY_ABBREVIATIONS[cleanCity];
    }
    
    // Fallback: first 3 characters
    return cleanCity.substring(0, 3).padEnd(3, "X");
}
