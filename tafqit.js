/*********************************************************************
* @function      : tafqit(Number [,{options}])
* @purpose       : Converts Numbers to Arabic Words with Grammar Rules
* @version       : 1.70
* @author        : Mohsen Alyafei
* @date          : 04 August 2020
* @Licence       : MIT
* @param         : {Number} [Integer in Numeric or String form]
*                  Number may be in Arabic-Indic format (as a string)
* @param         : [{options}] 10 Options passed as object {name:value} as follows:
*
* {Feminine}     : "on": Generate string for a Feminine subject (أرقام بصيغة المؤنث).
*                        The default is the Masculine form.
* {Miah}         : "on": Use Mi'ah for Hundreds (مئة بدل مائة). Default is Ma'ah "مائة".
* {Comma}        : "on": Insert comma between triplet words.
* {SplitHund}    : "on": Split number from hundred words (فصل الرقم عن المئة).
                   i.e. ثلاث مائة. Default "No Split" i.e. (ثلاثمائة).
* {Billions}     : "on": Use Billions (بليون) instead of Miliard (مليار).
* {TextToFollow} : "on": Indicates that there will be text to follow the resulting text.
*                  This permits proper subject name to be added after the resulting text.
* {AG}           : "on": Text is produced in Accusative/Genitive (جر/نصب) case.
*                  The default is the Nominative cse (رفع).
*
* {Subjec}       : An optional array holding the Subject Name to be counted in 4 forms as follows:
*                  [0] = Deafult Name Singular      (e.g. "كتاب/تفاحة/دينار").
*                  [1] = Name for 2's (double)      (e.g. "كتابان/تفاحتان/ديناران").
*                  [2] = Name for plural            (e.g. "كتب/تفاحات/دنانير").
*                  [3] = Name Singular with Tanween (e.g. "كتابًا/تفاحةً/دينارًا").
*                  The subject name will be added to the resulting string in acordance
*                  with the number grammar rules.
* {Legal}        : "on" Uses the lagal form of output text.
* {Ordinal}      : "on" Produces ordinal numbers (الأول، الثاني، الثالث...).
*
* @returns       : {string} The wordified number string in Arabic.
**********************************************************************/
const TableScales =["","ألف","مليون","مليار","ترليون","كوادرليون","كوينتليون","سكستليون"], // Add here only
      TableScalesP=["","آلاف","ملايين","مليارات"], // Do not change this table
      TableMale   =["","واحد","اثنان","ثلاثة","أربعة","خمسة","ستة","سبعة","ثمانية","تسعة","عشرة"],
      TableFemale =["","واحدة","اثنتان","ثلاث","أربع","خمس","ست","سبع","ثمان","تسع","عشر"],
      // Ordinal Numbers Tables (الأرقام الترتيبية)
      TableOrdMale   =["","الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"],
      TableOrdFemale =["","الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة","التاسعة","العاشرة"],
      // Ordinal 11-19 (الحادي عشر - التاسع عشر)
      TableOrd11_19Male   =["الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر","السادس عشر","السابع عشر","الثامن عشر","التاسع عشر"],
      TableOrd11_19Female =["الحادية عشرة","الثانية عشرة","الثالثة عشرة","الرابعة عشرة","الخامسة عشرة","السادسة عشرة","السابعة عشرة","الثامنة عشرة","التاسعة عشرة"],
      // Ordinal Tens (العشرون - التسعون)
      TableOrdTens =["","","العشرون","الثلاثون","الأربعون","الخمسون","الستون","السبعون","الثمانون","التسعون"],
      // Ordinal Units for compound numbers (الحادي، الثاني... used with والعشرون، والثلاثون...)
      TableOrdUnitsMale   =["","الحادي","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع"],
      TableOrdUnitsFemale =["","الحادية","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة","التاسعة"];

function tafqit(NumIn=0,{Feminine,Comma,SplitHund,Miah,Billions,TextToFollow,AG,Subject,Legal,Ordinal}={}) {
if (NumIn == 0) return Ordinal === "on" ? "الصفر" : "صفر"; // if 0 or "0" then "zero"
let Triplet, Scale, ScalePos, ScalePlural, TableUnits, Table11_19,NumberInWords= "",IsLastEffTriplet= false,Num_99;
const ON= "on",                         // Flag to test if Option is ON
 IsAG   = (AG===ON),                    // Option Accusative or Genitive case Grammar?
 SpWa   = " و",                         // AND word
 TanweenLetter = "ًا",                   // Tanween Fatih for Scale Names above 10
 Ahad  = "أحد", Ehda= "إحدى",           // Masculine/Feminine 11
 // ---- Setup constants for the AG Option (Accusative/Genitive or Nominative case Grammar)
 Taa   = IsAG ?"تي" :"تا",       Taan   = IsAG ? "تين":"تان",        // Hundred 2's مئتا/مائتا مئتان/مائتان
 Aa    = IsAG ?"ي" :"ا",         Aan    = IsAG ? "ين":"ان",          // Scale 2's الفا/مليونا الفان/مليونان
 Ethna = IsAG ?"اثني":"اثنا",    Ethnata = IsAG ? "اثنتي" : "اثنتا", // Masculine/Feminine 12 starting word
 Ethnan= IsAG ?"اثنين" : "اثنان",Ethnatan= IsAG ? "اثنتين" :"اثنتان",// Masculine/Feminine 2
 Woon  = IsAG ?"ين" :"ون",              // Second part of 20's to 90's
 IsSubject = Array.isArray(Subject) && Subject.length===4;        // Check for Subject Array Names

TextToFollow = TextToFollow === ON;     // TextToFollow Option Flag
if(IsSubject) TextToFollow = true;     // Enable TextToFollow Option if Subject Option is ON
NumIn+="";                              // Make numeric string
NumIn =""+NumIn.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)); // Convert Arabic-Indic Numbers to Arabic if any

// Handle Ordinal Numbers (الأرقام الترتيبية)
if (Ordinal === ON) {
  return convertToOrdinal(+NumIn, Feminine === ON, IsAG);
}

Miah= (Miah===ON) ? "مئة" : "مائة";     // Select chosen Miah (Hundred) Option

TableUnits   = [...TableMale]; Table11_19= [...TableMale]; // Create copies of Masculine Table for manipulation
Table11_19[0]= TableFemale[10];         // Borrow word "عشرة" from Feminine's Table for use in 11-19
Table11_19[1]= Ahad;                    // Masculine starting words for 11
Table11_19[2]= Ethna;                   // Masculine starting words for 12
TableUnits[2]= Ethnan;                  // Masculine word for 2

NumIn = "0".repeat(NumIn.length * 2 % 3) + NumIn;        // Convert Number to a Triplets String

let NumLen = NumIn.length;
for (let digits= NumLen; digits>0; digits-=3) {          // Loop and convert each Triplet
  Triplet = +NumIn.substr(NumLen-digits,3);              // Get a Triplet Number
  IsLastEffTriplet= !+NumIn.substr(NumLen-digits+3);     // Determine if Last Effective Triplet
  if (Triplet) {                                         // If not Empty: Convert Triplet Number to Words
    ScalePos    = digits/3-1;                            // Position of Scale Name in Scale Table
    Scale       = TableScales[ScalePos];                 // Get Scale Name
    ScalePlural = (ScalePos<4 ? TableScalesP[ScalePos] : TableScales[ScalePos] + "ات"); // Make Scale Plural
    if (Billions && ScalePos===3) Scale="بليون", ScalePlural="بلايين";    // If Billions Option
    NumberInWords += oneTripletToWords();                                 // Convert 1 Triplet to Words
    if (!IsLastEffTriplet) NumberInWords+= (Comma===ON ? "،" :"") + SpWa; // Add "و " and Option Comma
  }
} // All done with conversion, Process Subject Name if any
let SubjectName="";
if (IsSubject) {                                          // Process Subject Name
  let space   = !IsLastEffTriplet ? "" : " ";             // Position correct spacing
  Triplet     = +(Triplet+"").slice(-2);                  // Get last 2 digits of last Triplet
  SubjectName = space + Subject[0];                       // Default Subject Name is at Pos 0
  if (Triplet>10)      SubjectName = space + Subject[3];  // Subject name with Tanween for 11-99
  else if (Triplet>2)  SubjectName = space + Subject[2];  // Subject name Plural for 3-10
  else if (Triplet>0)  SubjectName = Subject[Triplet-1]+" "+TableUnits[Num_99];  // Reverse names for 1 or 2
}
 return NumberInWords + SubjectName;                      // All done
//------------------------------------------------------------------
//    Core Function Converts 1 Triplet (1 to 999) to Arabic Words
//------------------------------------------------------------------
function oneTripletToWords() {
    Num_99   = Triplet % 100;               // 00 to 99
let Num_100  = ~~(Triplet/100),             // Hundreds (1 digit)
    Num_Unit = Num_99 % 10,                 // 0 to 9 (1 digit)
    Num_Tens = ~~(Num_99/10),               // Tens   (1 digit)
    Word_100 = "", Word_99= "";             // Holds words for Hundreds & 0-99

if (Feminine === ON && !Scale)  {          // If Feminine, use the Feminine table if no scale
  TableUnits   = [...TableFemale]; Table11_19= [...TableFemale];// Create copies of Feminine Table for manipulation
  Table11_19[0]= TableMale[10];             // Borrow word "عشر" from Masculine's Table for use in 11-19
  Table11_19[1]= Ehda;                      // Feminine starting words for 11
  Table11_19[2]= Ethnata;                   // Feminine starting words for 12
  TableUnits[2]= Ethnatan;                  // Feminine word for 2
  if (Num_99 > 19) TableUnits[1] = Ehda;    // Feminine word for 1 used in 20's to 90's
}

if (Num_100) {                              // ---- Do Hundreds (100 to 900)
 if (Num_100 >2) Word_100 = TableFemale[Num_100] + (SplitHund===ON ?" ":"") + Miah;// 300-900
 else if (Num_100 === 1) Word_100 = Miah;                                          // 100
 else Word_100 = Miah.slice(0,-1) +(Scale && !Num_99 || TextToFollow ?Taa:Taan);   // 200 Use either مئتا or مئتان
}

if (Num_99 >19)  Word_99 = TableUnits[Num_Unit] + (Num_Unit ? SpWa : "") +  // 20-99 Units و and
                 (Num_Tens === 2 ? "عشر" : TableFemale[Num_Tens]) + Woon;   // Add Woon for 20's or 30's to 90's
 else if (Num_99 > 10) Word_99 = Table11_19[Num_99-10] + " " + Table11_19[0]; // 11-19
 else if (Num_99>2 || !Num_99 || !IsSubject) Word_99 = TableUnits[Num_99];  // 0 or 3-10 (else keep void for 1 &2)

let Words999 = Word_100 + (Num_100 && Num_99 ? SpWa:"") + Word_99;          // Join Hund, Tens, and Units

if (Scale) {                                                                // Add Scale Name if applicable
  let legalTxt   = (Legal===ON && Num_99< 3)? " " + Scale : "";             // if Legal Option add Extra Word
  let Word_100Wa = (Num_100 ? Word_100 + legalTxt + SpWa :"") + Scale;      // Default Scale Name
  if (Num_99 > 2) {
    Words999 += " " +                                                       // Scale for for 3 to 99
    (Num_99 >10 ? Scale + (IsLastEffTriplet && TextToFollow ? "":TanweenLetter)// Scale for 11 to 99 (Tanween)
    : ScalePlural);                                                         // Scale for 3 to 10 (Plural)
  } else {
    if (!Num_99)           Words999 += " " +Scale;                          // Scale for 0
    else if (Num_99 === 1) Words999  = Word_100Wa;                          // Scale for 1
    else Words999 = Word_100Wa + (IsLastEffTriplet && TextToFollow ? Aa : Aan);// Scale for 2 ألفا or ألفان
    }
}
return Words999; //Return the Triple in Words
}

//------------------------------------------------------------------
//    Ordinal Numbers Function (الأرقام الترتيبية)
//------------------------------------------------------------------
function convertToOrdinal(num, isFeminine, isAG) {
  if (num === 0) return "الصفر";
  if (num < 0) return ""; // Ordinals not for negative numbers
  
  const TableOrd = isFeminine ? TableOrdFemale : TableOrdMale;
  const TableOrd11_19 = isFeminine ? TableOrd11_19Female : TableOrd11_19Male;
  const TableOrdUnits = isFeminine ? TableOrdUnitsFemale : TableOrdUnitsMale;
  const woon = isAG ? "ين" : "ون"; // العشرين/العشرون
  
  // 1-10
  if (num <= 10) return TableOrd[num];
  
  // 11-19
  if (num <= 19) return TableOrd11_19[num - 11];
  
  // 20-99
  if (num < 100) {
    const units = num % 10;
    const tens = Math.floor(num / 10);
    let tensWord = "";
    
    if (tens === 2) tensWord = "العشر" + woon;
    else if (tens === 3) tensWord = "الثلاث" + woon;
    else if (tens === 4) tensWord = "الأربع" + woon;
    else if (tens === 5) tensWord = "الخمس" + woon;
    else if (tens === 6) tensWord = "الست" + woon;
    else if (tens === 7) tensWord = "السبع" + woon;
    else if (tens === 8) tensWord = "الثمان" + woon;
    else if (tens === 9) tensWord = "التسع" + woon;
    
    if (units === 0) return tensWord;
    return TableOrdUnits[units] + " و" + tensWord;
  }
  
  // 100-999
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    let hundWord = "";
    const miahWord = (Miah === ON) ? "مئة" : "مائة";
    
    if (hundreds === 1) hundWord = "ال" + miahWord;
    else if (hundreds === 2) hundWord = "ال" + miahWord.slice(0,-1) + (isAG ? "تين" : "تان");
    else {
      const hundUnits = ["","","","ثلاث","أربع","خمس","ست","سبع","ثمان","تسع"];
      hundWord = "ال" + hundUnits[hundreds] + miahWord;
    }
    
    if (remainder === 0) return hundWord;
    return hundWord + " و" + convertToOrdinalWithoutAl(remainder, isFeminine, isAG);
  }
  
  // 1000+
  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let thousandWord = "";
    
    if (thousands === 1) thousandWord = "الألف";
    else if (thousands === 2) thousandWord = "الألف" + (isAG ? "ين" : "ان");
    else {
      // For 3+ thousands, use regular number + آلاف/ألف
      thousandWord = "ال" + tafqit(thousands, {AG: isAG ? "on" : ""}) + (thousands <= 10 ? " آلاف" : " ألف");
    }
    
    if (remainder === 0) return thousandWord;
    return thousandWord + " و" + convertToOrdinalWithoutAl(remainder, isFeminine, isAG);
  }
  
  // For millions and above, use a simpler approach
  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    let millionWord = "";
    
    if (millions === 1) millionWord = "المليون";
    else if (millions === 2) millionWord = "المليون" + (isAG ? "ين" : "ان");
    else {
      millionWord = "ال" + tafqit(millions, {AG: isAG ? "on" : ""}) + (millions <= 10 ? " ملايين" : " مليون");
    }
    
    if (remainder === 0) return millionWord;
    return millionWord + " و" + convertToOrdinalWithoutAl(remainder, isFeminine, isAG);
  }
  
  // Billions+
  const billions = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  let billionWord = "";
  
  if (billions === 1) billionWord = "المليار";
  else if (billions === 2) billionWord = "المليار" + (isAG ? "ين" : "ان");
  else {
    billionWord = "ال" + tafqit(billions, {AG: isAG ? "on" : ""}) + (billions <= 10 ? " مليارات" : " مليار");
  }
  
  if (remainder === 0) return billionWord;
  return billionWord + " و" + convertToOrdinalWithoutAl(remainder, isFeminine, isAG);
}

// Helper function for ordinal continuation (used after و) - keeps "ال" prefix
function convertToOrdinalWithoutAl(num, isFeminine, isAG) {
  if (num <= 0) return "";
  
  const TableOrd = isFeminine ? TableOrdFemale : TableOrdMale;
  const TableOrd11_19 = isFeminine ? TableOrd11_19Female : TableOrd11_19Male;
  const TableOrdUnits = isFeminine ? TableOrdUnitsFemale : TableOrdUnitsMale;
  const woon = isAG ? "ين" : "ون";
  
  // 1-10 - keep "ال" prefix for proper grammar (المائة والخامس)
  if (num <= 10) return TableOrd[num];
  
  // 11-19 - keep "ال" prefix
  if (num <= 19) return TableOrd11_19[num - 11];
  
  // 20-99
  if (num < 100) {
    const units = num % 10;
    const tens = Math.floor(num / 10);
    let tensWord = "";
    
    if (tens === 2) tensWord = "العشر" + woon;
    else if (tens === 3) tensWord = "الثلاث" + woon;
    else if (tens === 4) tensWord = "الأربع" + woon;
    else if (tens === 5) tensWord = "الخمس" + woon;
    else if (tens === 6) tensWord = "الست" + woon;
    else if (tens === 7) tensWord = "السبع" + woon;
    else if (tens === 8) tensWord = "الثمان" + woon;
    else if (tens === 9) tensWord = "التسع" + woon;
    
    if (units === 0) return tensWord;
    return TableOrdUnits[units] + " و" + tensWord;
  }
  
  // For larger numbers, recursively use the main ordinal function
  return convertToOrdinal(num, isFeminine, isAG);
}
}
