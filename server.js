// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.static("public"));

const GOOGLE_API_KEY = "AIzaSyCwXEH8l97wZsqgUXX1a4whJxe6-JR8iGE";
const GOOGLE_CX = "e4d88530845874719";

/* ✅ 1. 위인 데이터 풀 */
function refreshDailyFigures() {
  const allFigures = [
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
    { name: "넬슨 만델라", hint: "남아프리카공화국 인권운동가" },
    { name: "레오나르도 다 빈치", hint: "모나리자 화가" },
    { name: "나폴레옹", hint: "프랑스의 군인·정치가" },
    { name: "체 게바라", hint: "쿠바 혁명가" },
    { name: "갈릴레오 갈릴레이", hint: "지동설 주장" }
  ];

  const shuffled = allFigures.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6); // 🔹 하루 세트: 랜덤 6명
}

/* ✅ 2. 날짜 기준 자동 갱신 */
let figures = refreshDailyFigures();
let today = new Date().toDateString();
let usedIndexes = [];

function resetIfNewDay() {
  const now = new Date().toDateString();
  if (now !== today) {
    today = now;
    figures = refreshDailyFigures(); // 새 인물 세트 생성
    usedIndexes = [];
    console.log("🔄 새로운 날짜 감지 → 위인 세트 갱신 완료");
  }
}

/* ✅ 3. API 엔드포인트 */
app.get("/api/quiz", async (req, res) => {
  resetIfNewDay();

  try {
    // 중복되지 않은 문제 선택
    const availableIndexes = figures
      .map((_, i) => i)
      .filter((i) => !usedIndexes.includes(i));

    if (availableIndexes.length === 0) usedIndexes = [];

    const selectedIndex =
      availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    usedIndexes.push(selectedIndex);
    const question = figures[selectedIndex];

    // 구글 이미지 검색
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&searchType=image&q=${encodeURIComponent(
      question.name
    )}`;

    const { data } = await axios.get(url);
    const imageUrl = data.items?.[0]?.link || "";

    res.json({
      name: question.name,
      hint: question.hint,
      imageUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ✅ 4. 로컬 실행용 */
app.listen(3003, () => console.log("✅ 서버 실행 중: http://localhost:3003"));

/* ✅ 5. Vercel 호환용 */
export default app;
