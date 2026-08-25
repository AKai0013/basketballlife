/* BasketballLife pure data — loaded as a classic script. */
const seedPool=["K8M2X7QP","7RNP4A2Z","V9T4L2QK","M3X8P6RA","Q7N2K9WV","A4Z8M2TR","P6Q3X9LK","R8V2N5MA","T4K7Q1ZX","W9M3P8LR","B5Q7K2NP","C8R4M9TX","D2V7P6LA","F9K3Q8MW","G4N6X2RP","H7M9T3KA","J2Q8V5LN","L6P4R9XK","N3T7M2QA","P8W5K4ZR","R2L9Q6MX","T7A3N8KP","V4M2X9RQ","X8Q5L3NP","Z2R7K6MV","B9T4P2XA","C3M8Q7LK","D7P2V9RN","F4X6K3MT","G8Q2L7PA","H3N9R5KV","J6M4T8QX","L2P7A9RN","N8V3K5MQ","P4Q9X2LT","R7M5A8KN","T2K6P9QV","V9L3R4MX","X5N8Q2KA","Z7P4M6RT","B2V9L5QK","C7M3X8PA","D4Q6R2VN","F8K5T9LM","G2P7N4RX","H9V3M6QA","J5L8Q2KP","L7R4X9MN","N2K8P5VT","P9M6Q3LA"];
const SEED_ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SEED_TIER_DEFS=[
 {key:"SSS+",label:"💠 SSS+ 神話",start:[7,10],cap:[42,52],growth:[98,99],count:0,desc:"約 1% 的極端天賦；可同時擁有多項世代級專長，但傷病、選擇與角色仍會決定能否兌現。",v9:{startAverage:[46,50],capTotal:[752,776],growth:[98,99],eliteSlots:[3,4],eliteFloor:99,coreFloor:97,supportFloor:94,foundationFloor:88}},
 {key:"SS+",label:"🌌 SS+ 超級",start:[5,8],cap:[38,49],growth:[95,99],count:0,desc:"約 2% 的世界級潛力；核心專長具備登上最高舞台的上限，不代表每項能力都會自然滿值。",v9:{startAverage:[44,48],capTotal:[712,744],growth:[95,98],eliteSlots:[2,3],eliteFloor:97,coreFloor:94,supportFloor:89,foundationFloor:82}},
 {key:"S+",label:"👑 S+ 傳奇",start:[4,7],cap:[35,46],growth:[93,99],count:3,desc:"世代級天賦；通常擁有兩項以上頂尖發展線，合理養成可挑戰 NBA 明星。",v9:{startAverage:[42,46],capTotal:[672,704],growth:[91,97],eliteSlots:[2,2],eliteFloor:94,coreFloor:89,supportFloor:84,foundationFloor:74}},
 {key:"S",label:"⭐ S 頂尖",start:[2,5],cap:[32,43],growth:[86,96],count:7,desc:"海外頂級與 NBA 挑戰級潛力；明確專長是主要競爭力，養成選擇會拉開生涯差距。",v9:{startAverage:[40,44],capTotal:[632,664],growth:[84,93],eliteSlots:[1,2],eliteFloor:90,coreFloor:84,supportFloor:77,foundationFloor:67}},
 {key:"A",label:"🔥 A 優秀",start:[0,3],cap:[30,40],growth:[79,91],count:12,desc:"優秀職業天賦；能靠一項突出能力與完整角色站穩高層級聯賽。",v9:{startAverage:[38,41],capTotal:[584,616],growth:[76,87],eliteSlots:[1,1],eliteFloor:86,coreFloor:78,supportFloor:70,foundationFloor:60}},
 {key:"B",label:"🏀 B 普通",start:[-1,2],cap:[27,37],growth:[68,83],count:18,desc:"正常職業天賦；需要把有限養成資源投入適合自己的角色，仍有機會靠表現旅外。",v9:{startAverage:[36,39],capTotal:[532,556],growth:[65,79],eliteSlots:[1,1],eliteFloor:78,coreFloor:70,supportFloor:63,foundationFloor:54}},
 {key:"C",label:"🎲 C 苦命",start:[-4,-1],cap:[20,30],growth:[50,68],count:10,desc:"職業邊緣天賦；仍會保留一條可辨識的專長路線，但需要長期突破與正確選擇才能逆襲。",v9:{startAverage:[34,37],capTotal:[484,516],growth:[50,66],eliteSlots:[1,1],eliteFloor:70,coreFloor:62,supportFloor:56,foundationFloor:48}}
];

// A map version belongs to the career save. New V9 careers use map 2; saves
// created before this re-map retain map 1 so their generated player stays intact.
const V90_LEGACY_SEED_TIER_MAP_VERSION=1;
const V90_SEED_TIER_MAP_VERSION=2;

function v90SeedHash(value){
 let hash=2166136261;
 for(const ch of String(value||"")){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return hash>>>0;
}
function v90SeedTierKeyFromBucket(bucket){
 if(bucket<100)return "SSS+";
 if(bucket<300)return "SS+";
 if(bucket<600)return "S+";
 if(bucket<2000)return "S";
 if(bucket<4400)return "A";
 if(bucket<8000)return "B";
 return "C";
}
function v90LegacyFixedSeedTier(seed){
 const idx=seedPool.indexOf(seed);
 if(idx<0)return "";
 if(idx<3)return "S+";
 if(idx<10)return "S";
 if(idx<22)return "A";
 if(idx<40)return "B";
 return "C";
}
function v90SeedTierProfile(seed,mapVersion=V90_SEED_TIER_MAP_VERSION){
 const normalized=String(seed||"").toUpperCase();
 const version=Number(mapVersion)===V90_LEGACY_SEED_TIER_MAP_VERSION?V90_LEGACY_SEED_TIER_MAP_VERSION:V90_SEED_TIER_MAP_VERSION;
 let key;
 if(version===V90_LEGACY_SEED_TIER_MAP_VERSION){
   key=v90LegacyFixedSeedTier(normalized)||v90SeedTierKeyFromBucket(v90SeedHash(normalized)%10000);
 }else{
   // Rotate every old procedural bucket into the opposite half of the table.
   // In particular, every map-1 SSS+/SS+ code now lands outside the elite tiers.
   key=v90SeedTierKeyFromBucket((v90SeedHash(normalized)%10000+5000)%10000);
 }
 return SEED_TIER_DEFS.find(t=>t.key===key)||SEED_TIER_DEFS.find(t=>t.key==="B");
}

const V90_TALENT_ARCHETYPES={
 lead_guard:{label:"組織核心",core:["pass","handle","iq"],support:["shoot","ath"]},
 scoring_guard:{label:"持球得分手",core:["shoot","finish","handle"],support:["ath","iq"]},
 rebounding_guard:{label:"籃板後衛",core:["rebound","ath","defense"],support:["handle","iq"]},
 two_way_wing:{label:"攻守側翼",core:["defense","ath","shoot"],support:["finish","iq"]},
 wing_creator:{label:"持球側翼",core:["handle","finish","shoot"],support:["pass","ath"]},
 point_forward:{label:"組織前鋒",core:["pass","handle","iq"],support:["rebound","finish"]},
 slashing_forward:{label:"衝框前鋒",core:["finish","ath","defense"],support:["handle","rebound"]},
 stretch_big:{label:"外線型長人",core:["shoot","rebound","iq"],support:["pass","defense"]},
 point_center:{label:"組織中鋒",core:["pass","iq","rebound"],support:["handle","finish"]},
 rim_anchor:{label:"護框核心",core:["defense","rebound","ath"],support:["finish","iq"]},
 post_hub:{label:"低位策應核心",core:["finish","pass","iq"],support:["rebound","defense"]},
 connector:{label:"全能串聯者",core:["iq","pass","defense"],support:["shoot","handle"]}
};

const V90_POSITION_ARCHETYPE_WEIGHTS={
 PG:{lead_guard:24,scoring_guard:18,rebounding_guard:12,wing_creator:14,point_forward:7,two_way_wing:8,connector:12,point_center:5},
 SG:{scoring_guard:22,two_way_wing:17,wing_creator:18,lead_guard:10,rebounding_guard:9,slashing_forward:10,connector:9,stretch_big:5},
 SF:{two_way_wing:20,wing_creator:17,point_forward:15,slashing_forward:14,connector:10,stretch_big:9,rebounding_guard:7,post_hub:8},
 PF:{two_way_wing:13,point_forward:14,stretch_big:17,rim_anchor:16,post_hub:15,point_center:12,slashing_forward:8,connector:5},
 C:{rim_anchor:22,post_hub:18,point_center:18,stretch_big:16,point_forward:8,connector:7,slashing_forward:6,two_way_wing:5}
};

const POSITIONS=["PG","SG","SF","PF","C"];
const L={shoot:"投射",finish:"終結",handle:"控球",pass:"傳球",defense:"防守",rebound:"籃板",ath:"體能",iq:"球商"};
const ABILITY_HELP={
 shoot:"外線與中距離手感；最直接影響三分命中率。",
 finish:"切入、籃下與對抗得分；最直接影響兩分效率與整體 FG。",
 handle:"持球穩定、創造出手與降低失誤風險。",
 pass:"助攻產量、組織進攻與隊友得分機會。",
 defense:"抄截、阻攻、對位壓制與防守角色。",
 rebound:"進攻／防守籃板產量與禁區影響力。",
 ath:"速度、第一步、彈跳、爆發、對抗與耐力；影響切入輔助、上場時間、連戰疲勞、恢復與身體負荷。",
 iq:"閱讀比賽、效率、組織與事件判斷。"
};
const TAIWAN_BIRTHPLACES=["臺北市","新北市","桃園市","臺中市","臺南市","高雄市","基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣","南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣","臺東縣","澎湖縣","金門縣","連江縣"];
const POSITION_BODY_RANGES={
 PG:{height:[175,198],defaultHeight:188,reach:[2,18],defaultReach:10},
 SG:{height:[183,203],defaultHeight:195,reach:[3,20],defaultReach:11},
 SF:{height:[190,208],defaultHeight:201,reach:[4,23],defaultReach:13},
 PF:{height:[196,214],defaultHeight:205,reach:[5,25],defaultReach:15},
 C:{height:[201,224],defaultHeight:211,reach:[5,29],defaultReach:18}
};
