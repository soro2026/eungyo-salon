/**
 * lib/answer_compare.js
 * 
 * EG스타디움 정답 비교 라이브러리
 * 
 * 역할: game_core.js의 정답 판정 로직 단일 진실 원천
 * 
 * 매뉴얼 v1.8 기준:
 *   - 5.7절 (형식별 결과 풀)과 짝
 *   - 5.8절 (정답 비교 로직) 정의
 *   - validator.html은 import 안 함 (환경 분리)
 * 
 * 작성: 파이스
 * 날짜: 2026.05.04
 * 의존: 없음 (순수 JavaScript)
 */


/**
 * 정답 문자열 정규화
 * - trim
 * - 모든 공백 제거 (스페이스·탭·줄바꿈)
 * - 구두점 제거 (·.,!?'"()[]{} 등)
 * - 소문자화 (영문 대비)
 * 
 * @param {string} str - 정규화할 문자열
 * @returns {string} - 정규화된 문자열
 * 
 * 예:
 *   normalizeAnswer("안나 카레니나")     → "안나카레니나"
 *   normalizeAnswer("Anna Karenina")    → "annakarenina"
 *   normalizeAnswer("폴리·베르제르")     → "폴리베르제르"
 *   normalizeAnswer("")                 → ""
 *   normalizeAnswer(null)               → ""
 *   normalizeAnswer(undefined)          → ""
 */
export function normalizeAnswer(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/\s+/g, '')                    // 모든 공백 제거
    .replace(/[·.,!?'"()[\]{}<>《》「」『』]/g, '')  // 구두점 제거 (한국식 따옴표 포함)
    .toLowerCase();                          // 소문자화
}


/**
 * 주관식 정답 판정
 * - 1차: question.answer와 비교
 * - 2차: question.aliases 배열의 각 항목과 비교
 * - 모두 normalizeAnswer 후 비교 (관대 비교)
 * 
 * @param {string} userInput - 유저가 입력한 답
 * @param {object} question - 문제 객체
 *   - question.answer: 정답 (필수)
 *   - question.aliases: 동의어 배열 (선택)
 * @returns {boolean} - 정답이면 true
 * 
 * 예:
 *   const q = {
 *     answer: "안나카레니나",
 *     aliases: ["안나까레니나", "안나카레닌"]
 *   };
 *   checkAnswerSubjective("안나카레니나", q)    → true
 *   checkAnswerSubjective("안나 카레니나", q)   → true (공백 무시)
 *   checkAnswerSubjective("안나까레니나", q)    → true (alias)
 *   checkAnswerSubjective("안나 까레니나", q)   → true (alias + 공백)
 *   checkAnswerSubjective("안나카레닌", q)      → true (alias)
 *   checkAnswerSubjective("안나카레린", q)      → false
 *   checkAnswerSubjective("", q)                → false
 */
export function checkAnswerSubjective(userInput, question) {
  if (!question || !question.answer) return false;
  
  const userNormalized = normalizeAnswer(userInput);
  if (!userNormalized) return false;
  
  // 1차: answer 비교
  if (userNormalized === normalizeAnswer(question.answer)) {
    return true;
  }
  
  // 2차: aliases 비교 (있으면)
  if (Array.isArray(question.aliases)) {
    for (const alias of question.aliases) {
      if (userNormalized === normalizeAnswer(alias)) {
        return true;
      }
    }
  }
  
  return false;
}


/**
 * OX 정답 판정
 * - userChoice: "O" 또는 "X" (버튼 클릭 결과)
 * - 단순 비교 (정규화 불필요 — 버튼 텍스트 그대로)
 * 
 * @param {string} userChoice - 유저가 클릭한 버튼 ("O" 또는 "X")
 * @param {object} question - 문제 객체 (question.answer는 "O" 또는 "X")
 * @returns {boolean} - 정답이면 true
 * 
 * 예:
 *   const q = { answer: "O" };
 *   checkAnswerOX("O", q)  → true
 *   checkAnswerOX("X", q)  → false
 */
export function checkAnswerOX(userChoice, question) {
  if (!question || !question.answer) return false;
  if (!userChoice) return false;
  return userChoice === question.answer;
}


/**
 * 객관식 정답 판정
 * - userChoice: 유저가 클릭한 보기 텍스트
 * - 단순 비교 (정규화 불필요 — 보기 텍스트 그대로)
 * 
 * @param {string} userChoice - 유저가 클릭한 보기 텍스트
 * @param {object} question - 문제 객체 (question.answer는 정답 보기 텍스트)
 * @returns {boolean} - 정답이면 true
 * 
 * 예:
 *   const q = { 
 *     answer: "스푸마토",
 *     choices: ["스푸마토", "키아로스쿠로", "그라피아토"]
 *   };
 *   checkAnswerMC("스푸마토", q)        → true
 *   checkAnswerMC("키아로스쿠로", q)    → false
 */
export function checkAnswerMC(userChoice, question) {
  if (!question || !question.answer) return false;
  if (!userChoice) return false;
  return userChoice === question.answer;
}


/**
 * 통합 정답 판정 (편의 함수)
 * - question_type에 따라 자동 분기
 * 
 * @param {string} userInput - 유저 입력 (주관식: 텍스트 / OX·객관식: 버튼 텍스트)
 * @param {object} question - 문제 객체 (question.question_type 필수)
 * @returns {boolean} - 정답이면 true
 * 
 * 예:
 *   checkAnswer("안나카레니나", { question_type: "주관식", answer: "안나카레니나" })
 *   checkAnswer("O", { question_type: "OX", answer: "O" })
 *   checkAnswer("스푸마토", { question_type: "객관식", answer: "스푸마토" })
 */
export function checkAnswer(userInput, question) {
  if (!question || !question.question_type) return false;
  
  switch (question.question_type) {
    case '주관식':
      return checkAnswerSubjective(userInput, question);
    case 'OX':
      return checkAnswerOX(userInput, question);
    case '객관식':
      return checkAnswerMC(userInput, question);
    default:
      console.warn(`알 수 없는 question_type: ${question.question_type}`);
      return false;
  }
}
