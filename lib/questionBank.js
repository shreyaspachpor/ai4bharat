const QUESTION_BANK = {
  electrician: [
    {
      kn: "ನೀವು ಮೊದಲು ಯಾವ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने पहले कौन सा काम किया है?",
      en: "What kind of electrical work have you done before?",
      key: "past_experience",
    },
    {
      kn: "ವೈರಿಂಗ್ ಮಾಡುವಾಗ ಯಾವ ಸಮಸ್ಯೆ ಎದುರಿಸಿದ್ದೀರಿ?",
      hi: "वायरिंग करते समय किन समस्याओं का सामना किया?",
      en: "What problems have you faced while doing wiring work?",
      key: "problem_solving",
    },
    {
      kn: "ನೀವು ಒಬ್ಬರೇ ಕೆಲಸ ಮಾಡುತ್ತೀರಾ ಅಥವಾ ತಂಡದಲ್ಲಿ?",
      hi: "क्या आप अकेले काम करते हैं या टीम में?",
      en: "Do you work alone or as part of a team?",
      key: "teamwork",
    },
    {
      kn: "ನೀವು ಯಾವ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?",
      hi: "आप कौन से उपकरण उपयोग करते हैं?",
      en: "What tools and equipment do you use regularly?",
      key: "tools_knowledge",
    },
  ],
  plumber: [
    {
      kn: "ನೀವು ಎಷ್ಟು ವರ್ಷ ಪ್ಲಂಬಿಂಗ್ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने कितने साल प्लंबिंग का काम किया है?",
      en: "How many years have you worked as a plumber?",
      key: "past_experience",
    },
    {
      kn: "ಪೈಪ್ ಲೀಕ್ ಆದಾಗ ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      hi: "पाइप लीक होने पर आप क्या करते हैं?",
      en: "What do you do when a pipe starts leaking?",
      key: "problem_solving",
    },
    {
      kn: "ನೀವು ಯಾವ ರೀತಿಯ ಪೈಪ್ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने किस प्रकार का पाइप काम किया है?",
      en: "What types of pipe fitting work have you done?",
      key: "skills",
    },
    {
      kn: "ಕೆಲಸದ ಸ್ಥಳದಲ್ಲಿ ಸುರಕ್ಷತೆ ಹೇಗೆ ಕಾಪಾಡುತ್ತೀರಿ?",
      hi: "काम की जगह पर सुरक्षा कैसे बनाए रखते हैं?",
      en: "How do you maintain safety at the worksite?",
      key: "safety_awareness",
    },
  ],
  welder: [
    {
      kn: "ನೀವು ಯಾವ ರೀತಿಯ ವೆಲ್ಡಿಂಗ್ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने किस प्रकार की वेल्डिंग की है?",
      en: "What types of welding have you done?",
      key: "past_experience",
    },
    {
      kn: "ವೆಲ್ಡಿಂಗ್ ಮಾಡುವಾಗ ಯಾವ ಸುರಕ್ಷತಾ ಸಾಧನಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?",
      hi: "वेल्डिंग करते समय कौन से सुरक्षा उपकरण उपयोग करते हैं?",
      en: "What safety equipment do you use while welding?",
      key: "safety_awareness",
    },
    {
      kn: "ತಪ್ಪಾದ ವೆಲ್ಡ್ ಅನ್ನು ನೀವು ಹೇಗೆ ಗುರುತಿಸುತ್ತೀರಿ?",
      hi: "गलत वेल्ड को आप कैसे पहचानते हैं?",
      en: "How do you identify a defective weld?",
      key: "problem_solving",
    },
    {
      kn: "ನೀವು ದಿನಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಕೆಲಸ ಮಾಡಬಲ್ಲಿರಿ?",
      hi: "आप दिन में कितने घंटे काम कर सकते हैं?",
      en: "How many hours per day can you work?",
      key: "availability",
    },
  ],
  mason: [
    {
      kn: "ನೀವು ಇದುವರೆಗೆ ಯಾವ ಕಟ್ಟಡ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने अब तक कौन से निर्माण कार्य किए हैं?",
      en: "What construction work have you done so far?",
      key: "past_experience",
    },
    {
      kn: "ಇಟ್ಟಿಗೆ ಕೆಲಸ ಮತ್ತು ಪ್ಲಾಸ್ಟರಿಂಗ್ ಎರಡೂ ಮಾಡಬಲ್ಲಿರಾ?",
      hi: "क्या आप ईंट का काम और प्लास्टरिंग दोनों कर सकते हैं?",
      en: "Can you do both brickwork and plastering?",
      key: "skills",
    },
    {
      kn: "ನಕ್ಷೆ ನೋಡಿ ಕೆಲಸ ಮಾಡಬಲ್ಲಿರಾ?",
      hi: "क्या आप नक्शा देखकर काम कर सकते हैं?",
      en: "Can you read and work from a basic building plan?",
      key: "technical_knowledge",
    },
    {
      kn: "ನಿಮ್ಮ ತಂಡದಲ್ಲಿ ಎಷ್ಟು ಜನ ಇದ್ದಾರೆ?",
      hi: "आपकी टीम में कितने लोग हैं?",
      en: "How many people are in your usual work team?",
      key: "teamwork",
    },
  ],
  helper: [
    {
      kn: "ನೀವು ಮೊದಲು ಯಾವ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
      hi: "आपने पहले कौन सा काम किया है?",
      en: "What work have you done before?",
      key: "past_experience",
    },
    {
      kn: "ನೀವು ಯಾವ ಊರಿನಿಂದ ಬಂದಿದ್ದೀರಿ?",
      hi: "आप किस जगह से आए हैं?",
      en: "Where are you from?",
      key: "background",
    },
    {
      kn: "ನೀವು ದಿನಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಕೆಲಸ ಮಾಡಬಲ್ಲಿರಿ?",
      hi: "आप एक दिन में कितने घंटे काम कर सकते हैं?",
      en: "How many hours a day can you work?",
      key: "availability",
    },
    {
      kn: "ನೀವು ಹೊಸ ಕೆಲಸ ಕಲಿಯಲು ತಯಾರಿದ್ದೀರಾ?",
      hi: "क्या आप नया काम सीखने के लिए तैयार हैं?",
      en: "Are you willing to learn new types of work?",
      key: "attitude",
    },
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getQuestions(trade, language, count = 4) {
  const bank = QUESTION_BANK?.[trade] || [];
  const pick = shuffle(bank).slice(0, Math.max(1, Number(count) || 4));
  return pick.map((q) => {
    if (language === "kn") return q.kn;
    if (language === "hi") return q.hi;
    return q.en;
  });
}

export default QUESTION_BANK;

