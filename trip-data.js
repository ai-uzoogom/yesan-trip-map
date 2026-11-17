window.tripData = {
  title: "스플라스 리솜 온천 여행",
  dateRange: "2026.11.18–11.20",
  places: {
    home: { name: "용인 수지구청", short: "용인", address: "경기도 용인시 수지구 포은대로 435", point: [127.097401, 37.322245], label: [14, -11], scenes: ["road", "autumn"] },
    rest: { name: "행담도휴게소", short: "행담도", address: "충청남도 당진시 신평면 서해안고속도로 275", point: [126.807525, 36.944819], label: [-13, -11], scenes: ["road", "autumn"] },
    museum: { name: "윤봉길의사기념관", short: "기념관", address: "충청남도 예산군 덕산면 덕산온천로 183-5", point: [126.653, 36.6869], label: [13, 19], scenes: ["memorial", "autumn"] },
    bridge: { name: "예당호 출렁다리", short: "출렁다리", address: "충청남도 예산군 응봉면 예당관광로 161", point: [126.79894, 36.63789], label: [15, -12], scenes: ["bridge", "monorail"] },
    monorail: { name: "예당호 모노레일", short: "모노레일", address: "충청남도 예산군 응봉면 예당관광로 158", point: [126.79751, 36.63677], label: [15, 14], scenes: ["monorail", "bridge"] },
    resort: { name: "스플라스 리솜", short: "스플라스 리솜", address: "충청남도 예산군 덕산면 온천단지3로 45-7", point: [126.65470, 36.69426], label: [-14, -12], scenes: ["resort", "spa"] }
  },
  scenes: {
    road: { title: "가을 드라이브", image: "assets/road.jpg", position: "50% 57%" },
    autumn: { title: "늦가을 풍경", image: "assets/road.jpg", position: "17% 28%", detail: true },
    memorial: { title: "기념관 풍경", image: "assets/memorial.jpg" },
    bridge: { title: "예당호 풍경", image: "assets/bridge.jpg" },
    monorail: { title: "호숫가 모노레일", image: "assets/monorail.jpg" },
    spa: { title: "노천 온천", image: "assets/spa.jpg" },
    resort: { title: "리조트의 밤", image: "assets/resort.jpg" }
  },
  days: [
    {
      date: "2026.11.18", weekday: "수", title: "행담도에서 예당호까지", caption: "용인에서 예산으로",
      accent: "#66e7c6",
      events: [
        { id: "start", time: "08:30", place: "home", title: "용인 출발", desc: "자가용으로 예산을 향해 출발합니다.", kind: "출발", icon: "car", note: "덕산으로 출발" },
        { id: "rest", time: "09:35", place: "rest", title: "행담도휴게소", desc: "서해안고속도로 행담도휴게소에 들러 잠시 쉽니다.", kind: "경유 예정", icon: "coffee" },
        { id: "lunch1", time: "11:30", place: "bridge", title: "점심 식사", desc: "예당호 인근에서 점심을 먹습니다.", kind: "식사", icon: "food", noNav: true },
        { id: "bridge", time: "13:10", place: "bridge", title: "예당호 출렁다리", desc: "출렁다리를 건너며 늦가을 호수 풍경을 감상합니다.", kind: "산책", icon: "bridge" },
        { id: "fountain", time: "14:00", place: "bridge", title: "예당호 음악분수", desc: "음악분수 관람 예정입니다. 공연 여부와 시간은 현장 운영 공지를 확인하세요.", kind: "관람 예정", icon: "water" },
        { id: "monorail", time: "14:20", place: "monorail", title: "예당호 모노레일", desc: "모노레일을 타고 예당호 수변과 숲을 둘러봅니다.", kind: "탑승", icon: "train" },
        { id: "history", time: "15:20", place: "museum", title: "윤봉길의사기념관", desc: "윤봉길 의사의 생애와 독립운동 이야기를 살펴봅니다.", kind: "관람 예정", icon: "museum" },
        { id: "checkin", time: "16:00", place: "resort", title: "스플라스 리솜 체크인", desc: "리조트에 도착해 체크인하고 객실에서 잠시 쉽니다.", kind: "체크인", icon: "hotel" },
        { id: "dinner1", time: "18:30", place: "resort", title: "저녁 식사 및 휴식", desc: "저녁을 먹고 내일의 온천 일정을 위해 쉽니다.", kind: "휴식", icon: "food" }
      ]
    },
    {
      date: "2026.11.19", weekday: "목", title: "온천에서 보내는 하루", caption: "스플라스 리솜에서",
      accent: "#68ceff",
      events: [
        { id: "breakfast2", time: "08:00", place: "resort", title: "아침 식사", desc: "리조트에서 아침을 먹고 스파를 준비합니다.", kind: "식사", icon: "food" },
        { id: "spa2", time: "09:00", place: "resort", title: "스플라스 리솜 스파 입장", desc: "스파에 입장해 실내외 온천을 즐깁니다.", kind: "스파", icon: "water", scenes: ["spa", "resort"] },
        { id: "lunch2", time: "12:00", place: "resort", title: "점심 식사", desc: "오전 스파를 마치고 점심을 먹습니다.", kind: "식사", icon: "food" },
        { id: "waterpark", time: "13:00", place: "resort", title: "온천 및 워터파크", desc: "온천과 워터파크에서 오후를 보냅니다.", kind: "물놀이", icon: "water", scenes: ["spa", "resort"] },
        { id: "exit", time: "17:30", place: "resort", title: "샤워 및 퇴장", desc: "샤워하고 정리한 뒤 스파에서 나옵니다.", kind: "스파", icon: "water" },
        { id: "dinner2", time: "18:30", place: "resort", title: "저녁 식사 및 휴식", desc: "저녁 식사 후 리조트에서 쉬어갑니다.", kind: "휴식", icon: "food" }
      ]
    },
    {
      date: "2026.11.20", weekday: "금", title: "용인으로 돌아가는 길", caption: "예산에서 용인으로",
      accent: "#f6ba83",
      events: [
        { id: "breakfast3", time: "08:00", place: "resort", title: "아침 식사", desc: "체크아웃하기 전 리조트에서 아침을 먹습니다.", kind: "식사", icon: "food" },
        { id: "walk", time: "09:00", place: "resort", title: "산책 및 짐 정리", desc: "리조트 주변을 산책하고 객실에서 짐을 정리합니다.", kind: "산책", icon: "walk" },
        { id: "checkout", time: "11:00", place: "resort", title: "체크아웃 및 출발", desc: "체크아웃한 뒤 자가용으로 용인으로 출발합니다.", kind: "체크아웃", icon: "car" },
        { id: "arrive", time: "13:00", place: "home", title: "용인 도착 예상", desc: "계획상 도착 시각입니다. 실제 도착 시각은 교통 상황에 따라 달라질 수 있습니다.", kind: "도착 예정", icon: "pin" }
      ]
    }
  ],
  legs: {
    "home-rest": { color: "#66e7c6", mode: "car" },
    "rest-bridge": { color: "#5ed2ff", mode: "car" },
    "bridge-monorail": { color: "#f6ba83", mode: "foot" },
    "monorail-museum": { color: "#c0a2fa", mode: "car" },
    "museum-resort": { color: "#bfe77a", mode: "car" },
    "resort-home": { color: "#ff987d", mode: "car" }
  }
};
