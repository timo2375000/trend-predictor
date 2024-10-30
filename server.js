const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 네이버 데이터랩 API 엔드포인트
app.post('/api/trend-analysis', async (req, res) => {
  const { keyword } = req.body;
  
  // 1년치 데이터 가져오기
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const body = {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    timeUnit: 'month',
    keywordGroups: [
      {
        groupName: keyword,
        keywords: [keyword]
      }
    ],
    device: 'pc',
    ages: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    gender: 'f'
  };

  try {
    const response = await axios.post(
      'https://openapi.naver.com/v1/datalab/search',
      body,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          'Content-Type': 'application/json'
        }
      }
    );

    // 예측 데이터 생성
    const historicalData = response.data.results[0].data;
    const predictedData = generatePrediction(historicalData);

    res.json({
      historical: historicalData,
      predicted: predictedData,
      keyword: keyword
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: '데이터 분석 중 오류가 발생했습니다.' });
  }
});

// 간단한 예측 함수
function generatePrediction(historicalData) {
  const lastThreeMonths = historicalData.slice(-3);
  const average = lastThreeMonths.reduce((acc, curr) => acc + curr.ratio, 0) / 3;
  const trend = (lastThreeMonths[2].ratio - lastThreeMonths[0].ratio) / 2;

  const nextTwoMonths = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].period);

  for (let i = 1; i <= 2; i++) {
    const nextMonth = new Date(lastDate);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    
    nextTwoMonths.push({
      period: nextMonth.toISOString().slice(0, 7),
      ratio: Math.max(0, average + (trend * i))
    });
  }

  return nextTwoMonths;
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.`);
});