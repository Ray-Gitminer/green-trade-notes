import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "th" | "en";

interface Translations {
  [key: string]: {
    th: string;
    en: string;
  };
}

const translations: Translations = {
  // App Layout / Navigation
  "app.title": { th: "แม่ปลา ปากกาเขียว", en: "Mae Pla Green Pen" },
  "app.subtitle": { th: "สมุดบันทึกการเทรด", en: "Trading Journal" },
  "nav.dashboard": { th: "หน้าหลัก", en: "Dashboard" },
  "nav.newTrade": { th: "บันทึกเทรดใหม่", en: "New Trade" },
  "nav.journal": { th: "บันทึกการเทรด", en: "Trade Journal" },
  "nav.analytics": { th: "วิเคราะห์ผล", en: "Analytics" },
  "nav.templates": { th: "เทมเพลต", en: "Templates" },
  "nav.backtesting": { th: "ทดสอบกลยุทธ์", en: "Backtesting" },
  "nav.riskJournal": { th: "บันทึกความเสี่ยง", en: "Risk Journal" },
  "nav.goals": { th: "เป้าหมาย", en: "Goals" },
  "nav.notes": { th: "บันทึกประจำวัน", en: "Daily Notes" },
  "nav.knowledge": { th: "คลังความรู้", en: "Knowledge Library" },
  "nav.settings": { th: "ตั้งค่า", en: "Settings" },
  "nav.signOut": { th: "ออกจากระบบ", en: "Sign Out" },

  // Dashboard
  "dashboard.title": { th: "หน้าหลัก", en: "Dashboard" },
  "dashboard.welcome": { th: "ยินดีต้อนรับกลับ! นี่คือภาพรวมการเทรดของคุณ", en: "Welcome back! Here's your trading overview." },
  "dashboard.totalTrades": { th: "จำนวนเทรดทั้งหมด", en: "Total Trades" },
  "dashboard.closedPositions": { th: "ปิดสถานะแล้ว", en: "Closed positions" },
  "dashboard.winRate": { th: "อัตราชนะ", en: "Win Rate" },
  "dashboard.successRatio": { th: "อัตราความสำเร็จ", en: "Success ratio" },
  "dashboard.netProfit": { th: "กำไรสุทธิ", en: "Net Profit" },
  "dashboard.totalPL": { th: "กำไร/ขาดทุน รวม", en: "Total P/L" },
  "dashboard.profitFactor": { th: "Profit Factor", en: "Profit Factor" },
  "dashboard.winLossRatio": { th: "อัตราชนะ/แพ้", en: "Win/Loss ratio" },
  "dashboard.equityCurve": { th: "เส้นกราฟ Equity", en: "Equity Curve" },
  "dashboard.quickActions": { th: "ทางลัด", en: "Quick Actions" },
  "dashboard.recentTrades": { th: "เทรดล่าสุด", en: "Recent Trades" },
  "dashboard.viewAll": { th: "ดูทั้งหมด", en: "View All" },
  "dashboard.noTrades": { th: "ยังไม่มีเทรดที่ปิดสถานะ เริ่มเทรดเพื่อดูประวัติ!", en: "No closed trades yet. Start trading to see your history!" },

  // New Trade
  "newTrade.title": { th: "บันทึกแผนเทรดใหม่", en: "New Trade Plan" },
  "newTrade.subtitle": { th: "สร้างแผนการเทรดพร้อมวิเคราะห์ความเสี่ยง", en: "Create a detailed trade plan with risk analysis" },
  "newTrade.paperTrade": { th: "Paper Trade", en: "Paper Trade" },
  "newTrade.tradeSetup": { th: "ตั้งค่าเทรด", en: "Trade Setup" },
  "newTrade.pair": { th: "คู่เงิน", en: "Pair" },
  "newTrade.selectPair": { th: "เลือกคู่เงิน", en: "Select pair" },
  "newTrade.direction": { th: "ทิศทาง", en: "Direction" },
  "newTrade.buyLong": { th: "BUY (Long)", en: "BUY (Long)" },
  "newTrade.sellShort": { th: "SELL (Short)", en: "SELL (Short)" },
  "newTrade.entryPrice": { th: "ราคาเข้า", en: "Entry Price" },
  "newTrade.stopLoss": { th: "Stop Loss", en: "Stop Loss" },
  "newTrade.takeProfit": { th: "Take Profit", en: "Take Profit" },
  "newTrade.riskCalculator": { th: "คำนวณความเสี่ยง", en: "Risk Calculator" },
  "newTrade.accountBalance": { th: "ยอดเงินในบัญชี ($)", en: "Account Balance ($)" },
  "newTrade.riskPercent": { th: "ความเสี่ยง (%)", en: "Risk (%)" },
  "newTrade.calculatedLotSize": { th: "Lot Size ที่คำนวณได้", en: "Calculated Lot Size" },
  "newTrade.riskAmount": { th: "จำนวนเงินที่เสี่ยง", en: "Risk Amount" },
  "newTrade.rrRatio": { th: "อัตรา R:R", en: "R:R Ratio" },
  "newTrade.psychologyCheck": { th: "ตรวจสอบจิตวิทยา", en: "Psychology Check" },
  "newTrade.emotionalState": { th: "สภาพอารมณ์", en: "Emotional State" },
  "newTrade.confidenceLevel": { th: "ระดับความมั่นใจ", en: "Confidence Level" },
  "newTrade.preTradeNotes": { th: "บันทึกก่อนเทรด", en: "Pre-Trade Notes" },
  "newTrade.preTradeNotesPlaceholder": { th: "รู้สึกอย่างไร? มีความกังวลอะไรไหม?", en: "How are you feeling? Any concerns?" },
  // Emotional states
  "emotion.confident": { th: "มั่นใจ", en: "Confident" },
  "emotion.calm": { th: "สงบ", en: "Calm" },
  "emotion.anxious": { th: "กังวล", en: "Anxious" },
  "emotion.fomo": { th: "FOMO", en: "FOMO" },
  "emotion.revenge": { th: "แก้แค้น", en: "Revenge" },
  "emotion.tired": { th: "เหนื่อย", en: "Tired" },
  "emotion.excited": { th: "ตื่นเต้น", en: "Excited" },
  "emotion.neutral": { th: "ปกติ", en: "Neutral" },
  "newTrade.analysis": { th: "วิเคราะห์", en: "Analysis" },
  "newTrade.analysisPlaceholder": { th: "ทำไมถึงเข้าเทรดนี้? แนวคิดของคุณคืออะไร?", en: "Why are you taking this trade? What's your thesis?" },
  "newTrade.savePlan": { th: "บันทึกแผนเทรด", en: "Save Trade Plan" },
  "newTrade.errorSelectPair": { th: "กรุณาเลือกคู่เงิน", en: "Please select a trading pair" },
  "newTrade.tradeCreated": { th: "บันทึกเทรดแล้ว!", en: "Trade Created!" },
  "newTrade.tradeSaved": { th: "บันทึกแผนเทรดสำเร็จแล้ว", en: "trade plan saved successfully." },

  // Trade Journal
  "journal.title": { th: "บันทึกการเทรด", en: "Trade Journal" },
  "journal.subtitle": { th: "ทบทวนและวิเคราะห์ประวัติการเทรด", en: "Review and analyze your trading history" },
  "journal.allTrades": { th: "ทั้งหมด", en: "All Trades" },
  "journal.liveOnly": { th: "Live เท่านั้น", en: "Live Only" },
  "journal.paperOnly": { th: "Paper เท่านั้น", en: "Paper Only" },
  "journal.exportCSV": { th: "ส่งออก CSV", en: "Export CSV" },
  "journal.date": { th: "วันที่", en: "Date" },
  "journal.type": { th: "ประเภท", en: "Type" },
  "journal.entry": { th: "ราคาเข้า", en: "Entry" },
  "journal.status": { th: "สถานะ", en: "Status" },
  "journal.pl": { th: "กำไร/ขาดทุน", en: "P/L" },
  "journal.noTrades": { th: "ไม่พบเทรด", en: "No trades found" },

  // Analytics
  "analytics.title": { th: "วิเคราะห์ผลเทรด", en: "Trade Analytics" },
  "analytics.subtitle": { th: "เจาะลึกผลการเทรดของคุณ", en: "Deep dive into your trading performance" },
  "analytics.bestPair": { th: "คู่เงินที่ดีที่สุด", en: "Best Pair" },
  "analytics.worstPair": { th: "คู่เงินที่แย่ที่สุด", en: "Worst Pair" },
  "analytics.totalPairsTraded": { th: "จำนวนคู่เงินที่เทรด", en: "Total Pairs Traded" },
  "analytics.plByPair": { th: "กำไร/ขาดทุน ตามคู่เงิน", en: "P/L by Pair" },
  "analytics.plByDay": { th: "กำไร/ขาดทุน ตามวัน", en: "P/L by Day of Week" },

  // Templates
  "templates.title": { th: "เทมเพลตการเทรด", en: "Trade Templates" },
  "templates.subtitle": { th: "บันทึกและใช้ซ้ำการตั้งค่าเทรด", en: "Save and reuse common trade setups" },
  "templates.newTemplate": { th: "เทมเพลตใหม่", en: "New Template" },
  "templates.createTemplate": { th: "สร้างเทมเพลต", en: "Create Template" },
  "templates.name": { th: "ชื่อ", en: "Name" },
  "templates.category": { th: "หมวดหมู่", en: "Category" },
  "templates.defaultPair": { th: "คู่เงินเริ่มต้น", en: "Default Pair" },
  "templates.description": { th: "รายละเอียด", en: "Description" },
  "templates.saveTemplate": { th: "บันทึกเทมเพลต", en: "Save Template" },
  "templates.noDescription": { th: "ไม่มีรายละเอียด", en: "No description" },
  "templates.noTemplates": { th: "ยังไม่มีเทมเพลต สร้างใหม่เพื่อเริ่มต้น!", en: "No templates yet. Create one to get started!" },
  "templates.templateSaved": { th: "บันทึกเทมเพลตแล้ว!", en: "Template saved!" },
  "templates.scalping": { th: "Scalping", en: "Scalping" },
  "templates.swing": { th: "Swing", en: "Swing" },
  "templates.breakout": { th: "Breakout", en: "Breakout" },
  "templates.reversal": { th: "Reversal", en: "Reversal" },

  // Backtesting
  "backtesting.title": { th: "ทดสอบกลยุทธ์", en: "Backtesting Lab" },
  "backtesting.subtitle": { th: "ทดสอบและยืนยันกลยุทธ์การเทรด", en: "Test and validate trading strategies" },
  "backtesting.newStrategy": { th: "กลยุทธ์ใหม่", en: "New Strategy" },
  "backtesting.createStrategy": { th: "สร้างกลยุทธ์", en: "Create Strategy" },
  "backtesting.status": { th: "สถานะ", en: "Status" },
  "backtesting.entryCriteria": { th: "เงื่อนไขเข้า", en: "Entry Criteria" },
  "backtesting.exitCriteria": { th: "เงื่อนไขออก", en: "Exit Criteria" },
  "backtesting.rules": { th: "กฎ", en: "Rules" },
  "backtesting.saveStrategy": { th: "บันทึกกลยุทธ์", en: "Save Strategy" },
  "backtesting.noStrategies": { th: "ยังไม่มีกลยุทธ์ สร้างใหม่เพื่อเริ่มทดสอบ!", en: "No strategies yet. Create one to start backtesting!" },
  "backtesting.strategySaved": { th: "บันทึกกลยุทธ์แล้ว!", en: "Strategy saved!" },
  "backtesting.statusTesting": { th: "กำลังทดสอบ", en: "Testing" },
  "backtesting.statusValidated": { th: "ยืนยันแล้ว", en: "Validated" },
  "backtesting.statusRejected": { th: "ไม่ผ่าน", en: "Rejected" },
  "backtesting.statusReadyForLive": { th: "พร้อมใช้งานจริง", en: "Ready for Live" },

  // Risk Journal
  "riskJournal.title": { th: "บันทึกความเสี่ยง", en: "Risk Journal" },
  "riskJournal.subtitle": { th: "ติดตามจิตวิทยาและการตัดสินใจความเสี่ยง", en: "Track your trading psychology and risk decisions" },
  "riskJournal.sessionCheckin": { th: "เช็คอินเซสชัน", en: "Session Check-in" },
  "riskJournal.logDecision": { th: "บันทึกการตัดสินใจ", en: "Log Decision" },
  "riskJournal.sessionType": { th: "ประเภทเซสชัน", en: "Session Type" },
  "riskJournal.preSession": { th: "ก่อนเทรด", en: "Pre-Session" },
  "riskJournal.postSession": { th: "หลังเทรด", en: "Post-Session" },
  "riskJournal.mood": { th: "อารมณ์", en: "Mood" },
  "riskJournal.focusLevel": { th: "ระดับสมาธิ", en: "Focus Level" },
  "riskJournal.notes": { th: "บันทึก", en: "Notes" },
  "riskJournal.saveSession": { th: "บันทึกเซสชัน", en: "Save Session" },
  "riskJournal.sessionLogged": { th: "บันทึกเซสชันแล้ว!", en: "Session logged!" },
  "riskJournal.situation": { th: "สถานการณ์", en: "Situation" },
  "riskJournal.situationPlaceholder": { th: "สถานการณ์การเทรดคืออะไร?", en: "What was the trading situation?" },
  "riskJournal.decisionMade": { th: "การตัดสินใจ", en: "Decision Made" },
  "riskJournal.decisionPlaceholder": { th: "คุณตัดสินใจทำอะไร?", en: "What did you decide to do?" },
  "riskJournal.outcome": { th: "ผลลัพธ์", en: "Outcome" },
  "riskJournal.outcomePlaceholder": { th: "ผลลัพธ์เป็นอย่างไร?", en: "What was the result?" },
  "riskJournal.saveDecision": { th: "บันทึกการตัดสินใจ", en: "Save Decision" },
  "riskJournal.decisionLogged": { th: "บันทึกการตัดสินใจแล้ว!", en: "Decision logged!" },
  "riskJournal.sessionLogs": { th: "บันทึกเซสชัน", en: "Session Logs" },
  "riskJournal.riskDecisions": { th: "การตัดสินใจความเสี่ยง", en: "Risk Decisions" },
  "riskJournal.noSessions": { th: "ยังไม่มีบันทึกเซสชัน", en: "No session logs yet" },
  "riskJournal.noDecisions": { th: "ยังไม่มีบันทึกการตัดสินใจ", en: "No decisions logged yet" },
  // Moods for Risk Journal
  "mood.happy": { th: "มีความสุข", en: "Happy" },
  "mood.neutral": { th: "ปกติ", en: "Neutral" },
  "mood.stressed": { th: "เครียด", en: "Stressed" },
  "mood.tired": { th: "เหนื่อย", en: "Tired" },
  "mood.excited": { th: "ตื่นเต้น", en: "Excited" },
  "mood.anxious": { th: "กังวล", en: "Anxious" },
  // Sleep quality
  "sleep.good": { th: "ดี", en: "Good" },
  "sleep.average": { th: "ปานกลาง", en: "Average" },
  "sleep.poor": { th: "แย่", en: "Poor" },
  // Trade statuses
  "status.planned": { th: "วางแผน", en: "Planned" },
  "status.open": { th: "เปิดอยู่", en: "Open" },
  "status.closed": { th: "ปิดแล้ว", en: "Closed" },
  "status.cancelled": { th: "ยกเลิก", en: "Cancelled" },
  // Trade types
  "tradeType.buy": { th: "ซื้อ", en: "BUY" },
  "tradeType.sell": { th: "ขาย", en: "SELL" },
  // Paper trade
  "journal.paper": { th: "จำลอง", en: "Paper" },
  // Session types
  "sessionType.pre_session": { th: "ก่อนเทรด", en: "Pre-Session" },
  "sessionType.post_session": { th: "หลังเทรด", en: "Post-Session" },

  // Goals
  "goals.title": { th: "เป้าหมายการเทรด", en: "Trading Goals" },
  "goals.subtitle": { th: "ตั้งและติดตามเป้าหมายรายเดือน", en: "Set and track your monthly trading targets" },
  "goals.setGoals": { th: "ตั้งเป้าหมาย", en: "Set Goals" },
  "goals.monthlyGoals": { th: "เป้าหมายรายเดือน", en: "Set Monthly Goals" },
  "goals.profitTarget": { th: "เป้าหมายกำไร ($)", en: "Profit Target ($)" },
  "goals.winRateTarget": { th: "เป้าหมาย Win Rate (%)", en: "Win Rate Target (%)" },
  "goals.tradeCountTarget": { th: "เป้าหมายจำนวนเทรด", en: "Trade Count Target" },
  "goals.saveGoals": { th: "บันทึกเป้าหมาย", en: "Save Goals" },
  "goals.goalsSaved": { th: "บันทึกเป้าหมายแล้ว!", en: "Goals saved!" },
  "goals.noGoals": { th: "ยังไม่ได้ตั้งเป้าหมายเดือนนี้ กด \"ตั้งเป้าหมาย\" เพื่อเริ่มต้น!", en: "No goals set for this month. Click \"Set Goals\" to get started!" },

  // Daily Notes
  "notes.title": { th: "บันทึกประจำวัน", en: "Daily Notes" },
  "notes.subtitle": { th: "บันทึกมุมมองตลาดและจิตวิทยาการเทรด", en: "Journal your market insights and trading psychology" },
  "notes.newNote": { th: "บันทึกใหม่", en: "New Note" },
  "notes.marketOutlook": { th: "มุมมองตลาด", en: "Market Outlook" },
  "notes.psychology": { th: "จิตวิทยา", en: "Psychology" },
  "notes.lessonsLearned": { th: "บทเรียนที่ได้", en: "Lessons Learned" },
  "notes.general": { th: "ทั่วไป", en: "General" },
  "notes.placeholder": { th: "วันนี้คิดอะไรอยู่?", en: "What's on your mind today?" },
  "notes.saveNote": { th: "บันทึก", en: "Save Note" },
  "notes.noteSaved": { th: "บันทึกแล้ว!", en: "Note saved!" },
  "notes.noNotes": { th: "ยังไม่มีบันทึก เริ่มเขียน!", en: "No notes yet. Start journaling!" },

  // Knowledge Library
  "knowledge.title": { th: "คลังความรู้", en: "Knowledge Library" },
  "knowledge.subtitle": { th: "เก็บสื่อการเรียนรู้การเทรด", en: "Store your trading education materials" },
  "knowledge.addItem": { th: "เพิ่มรายการ", en: "Add Item" },
  "knowledge.addKnowledgeItem": { th: "เพิ่มรายการความรู้", en: "Add Knowledge Item" },
  "knowledge.title_field": { th: "หัวข้อ", en: "Title" },
  "knowledge.technicalAnalysis": { th: "วิเคราะห์ทางเทคนิค", en: "Technical Analysis" },
  "knowledge.riskManagement": { th: "บริหารความเสี่ยง", en: "Risk Management" },
  "knowledge.strategies": { th: "กลยุทธ์", en: "Strategies" },
  "knowledge.imageOptional": { th: "รูปภาพ (ไม่บังคับ)", en: "Image (optional)" },
  "knowledge.upload": { th: "อัปโหลด", en: "Upload" },
  "knowledge.itemAdded": { th: "เพิ่มรายการแล้ว!", en: "Item added!" },
  "knowledge.noItems": { th: "ยังไม่มีรายการ เพิ่มสื่อการเรียนรู้!", en: "No items yet. Add your first study material!" },

  // Settings
  "settings.title": { th: "ตั้งค่า", en: "Settings" },
  "settings.subtitle": { th: "จัดการบัญชีและการตั้งค่าของคุณ", en: "Manage your account and preferences" },
  "settings.profile": { th: "โปรไฟล์", en: "Profile" },
  "settings.email": { th: "อีเมล", en: "Email" },
  "settings.displayName": { th: "ชื่อที่แสดง", en: "Display Name" },
  "settings.yourName": { th: "ชื่อของคุณ", en: "Your name" },
  "settings.notifications": { th: "การแจ้งเตือน", en: "Notifications" },
  "settings.openTradeAlerts": { th: "แจ้งเตือนเทรดที่เปิดอยู่", en: "Open Trade Alerts" },
  "settings.openTradeAlertsDesc": { th: "เตือนให้ตรวจสอบสถานะที่เปิดอยู่", en: "Reminders to review open positions" },
  "settings.endOfDayJournal": { th: "บันทึกสิ้นวัน", en: "End of Day Journal" },
  "settings.endOfDayJournalDesc": { th: "แจ้งเตือนให้เขียนบันทึกประจำวัน", en: "Daily journaling prompts" },
  "settings.goalCheckins": { th: "ตรวจสอบเป้าหมาย", en: "Goal Check-ins" },
  "settings.goalCheckinsDesc": { th: "รายงานความคืบหน้าประจำสัปดาห์", en: "Weekly progress updates" },
  "settings.saveSettings": { th: "บันทึกการตั้งค่า", en: "Save Settings" },
  "settings.settingsSaved": { th: "บันทึกการตั้งค่าแล้ว!", en: "Settings saved!" },
  "settings.language": { th: "ภาษา", en: "Language" },
  "settings.thai": { th: "ไทย", en: "Thai" },
  "settings.english": { th: "English", en: "English" },

  // Auth
  "auth.login": { th: "เข้าสู่ระบบ", en: "Log In" },
  "auth.signUp": { th: "สมัครสมาชิก", en: "Sign Up" },
  "auth.password": { th: "รหัสผ่าน", en: "Password" },
  "auth.createAccount": { th: "สร้างบัญชี", en: "Create Account" },
  "auth.validationError": { th: "ข้อมูลไม่ถูกต้อง", en: "Validation Error" },
  "auth.invalidCredentials": { th: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง", en: "Please enter a valid email and password (min 6 chars)" },
  "auth.loginFailed": { th: "เข้าสู่ระบบไม่สำเร็จ", en: "Login Failed" },
  "auth.invalidEmailPassword": { th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่", en: "Invalid email or password. Please try again." },
  "auth.welcomeBack": { th: "ยินดีต้อนรับกลับ!", en: "Welcome back!" },
  "auth.loginSuccess": { th: "เข้าสู่ระบบสำเร็จแล้ว", en: "You have successfully logged in." },
  "auth.signUpFailed": { th: "สมัครสมาชิกไม่สำเร็จ", en: "Sign Up Failed" },
  "auth.alreadyRegistered": { th: "อีเมลนี้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ", en: "This email is already registered. Please log in instead." },
  "auth.accountCreated": { th: "สร้างบัญชีสำเร็จ!", en: "Account Created!" },
  "auth.canStartJournaling": { th: "คุณสามารถเริ่มบันทึกเทรดได้แล้ว", en: "You can now start journaling your trades." },

  // Common
  "common.save": { th: "บันทึก", en: "Save" },
  "common.cancel": { th: "ยกเลิก", en: "Cancel" },
  "common.delete": { th: "ลบ", en: "Delete" },
  "common.edit": { th: "แก้ไข", en: "Edit" },
  "common.loading": { th: "กำลังโหลด...", en: "Loading..." },
  "common.error": { th: "ข้อผิดพลาด", en: "Error" },
  "common.success": { th: "สำเร็จ", en: "Success" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("mae-pla-language");
    return (saved as Language) || "th";
  });

  useEffect(() => {
    localStorage.setItem("mae-pla-language", language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
