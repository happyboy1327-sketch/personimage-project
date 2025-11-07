// /api/quiz.js
import axios from "axios";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;
const DEFAULT_IMAGE = "/default-image.png"; // 반드시 public폴더에 넣어두세요

if (!GOOGLE_API_KEY || !GOOGLE_CX) {
  console.warn("WARNING: GOOGLE_API_KEY or GOOGLE_CX is not set. API calls will fail.");
}

// 전체 인물 풀
const ALL_FIGURES = [
  { name: "세종대왕", hint: "한글 창제" },
  { name: "이순신", hint: "명량해전 승리" },
  { name: "간디", hint: "인도의 독립운동 지도자" },
  { name: "링컨", hint: "미국 노예 해방" },
  { name: "아인슈타인", hint: "상대성이론" },
  { name: "유관순", hint: "3·1운동 참여" },
  { name: "소크라테스", hint: "고대 그리스 철학자" },
  { name: "신사임당", hint: "조선 시대 화가이자 율곡 이이의 어머니" },
  { name: "정약용", hint: "조선의 실학자, 다산" },
  { name: "마리 퀴리", hint: "방사능 연구" },
  { name: "넬슨 만델라", hint: "남아공 인권운동가" },
  { name: "레오나르도 다 빈치", hint: "모나리자 화가" },
  { name: "나폴레옹", hint: "프랑스의 군인·정치가" },
  { name: "체 게바라", hint: "쿠바 혁명가" },
  { name: "갈릴레오 갈릴레이", hint: "지동설 주장" }
];

function pickDailySet(pool = ALL_FIGURES, size = 6) {
  const arr = [...pool].sort(() => Math.random() - 0.5);
  return arr.slice(0, size);
}

/* 상태(메모리) */
let figures = pickDailySet();
let usedIndexes = [];
let today = new Date().toDateString();
let callCount = 0;
const DAILY_LIMIT = 100;

function resetIfNewDay() {
  const now = new Date().toDateString();
  if (now !== today) {
    today = now;
    figures = pickDailySet();
    usedIndexes = [];
    callCount = 0;
    console.log("🔄 New day detected — daily set refreshed");
  }
}

export default async function handler(req, res) {
  resetIfNewDay();

  if (callCount >= DAILY_LIMIT) {
    return res.status(429).json({ error: "오늘의 호출 한도를 초과했습니다 (100회)" });
  }

  try {
    // 안전하게 availableIndexes 계산 (재계산 로직 포함)
    let availableIndexes = figures.map((_, i) => i).filter(i => !usedIndexes.includes(i));
    if (availableIndexes.length === 0) {
      usedIndexes = [];
      availableIndexes = figures.map((_, i) => i);
    }

    const selectedIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    // 방어: 선택 실패 시 안전 반환
    if (selectedIndex === undefined || figures[selectedIndex] === undefined) {
      return res.status(500).json({ error: "퀴즈 선택에 실패했습니다." });
    }

    usedIndexes.push(selectedIndex);
    const question = figures[selectedIndex];

    // 기본값 보장
    const payload = {
      name: question.name || "이름 없음",
      hint: question.hint || "힌트 없음",
      imageUrl: DEFAULT_IMAGE
    };

    // 이미지 검색 (있으면 덮어쓰기)
    if (GOOGLE_API_KEY && GOOGLE_CX) {
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&searchType=image&q=${encodeURIComponent(question.name)}`;
        const { data } = await axios.get(url, { timeout: 5000 });
        if (data?.items?.[0]?.link) payload.imageUrl = data.items[0].link;
      } catch (e) {
        console.log("⚠ 이미지 검색 실패, 기본 이미지 사용:", e.message);
        // 아무런 예외는 발생시키지 말고 기본 이미지 유지
      }
    }

    callCount++;
    return res.status(200).json({ ...payload, remaining: DAILY_LIMIT - callCount });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

