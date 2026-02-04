import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function PlannerScreen() {
  const isFocused = useIsFocused();
  const [fortnightSchedule, setFortnightSchedule] = useState({
    WeekA: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
    WeekB: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
  });
  const [extraCurriculars, setExtraCurriculars] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [specialEvents, setSpecialEvents] = useState({});
  const [homeworkList, setHomeworkList] = useState({});
  const [dates, setDates] = useState([]);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  
  const [subjectInput, setSubjectInput] = useState('');
  const [extraInput, setExtraInput] = useState('');
  const [homeworkInput, setHomeworkInput] = useState('');
  const [eventInput, setEventInput] = useState('');

  useEffect(() => {
    if (isFocused) {
      generateDates();
      loadPlannerData();
    }
  }, [isFocused]);

  const generateDates = () => {
    const dayArray = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dayArray.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        dayNum: d.getDate(),
        weekType: getWeekType(d) 
      });
    }
    setDates(dayArray);
    if (!selectedDateObj) setSelectedDateObj(dayArray[0]);
  };

  const getWeekType = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + (firstDayOfYear.getDay() || 7)) / 7);
    return weekNum % 2 === 0 ? 'WeekB' : 'WeekA';
  };

  const loadPlannerData = async () => {
    try {
      const s1 = await AsyncStorage.getItem('fortnightSchedule');
      const s2 = await AsyncStorage.getItem('specialEvents');
      const s3 = await AsyncStorage.getItem('homeworkList');
      const s4 = await AsyncStorage.getItem('extraCurriculars');
      if (s1) setFortnightSchedule(JSON.parse(s1));
      if (s2) setSpecialEvents(JSON.parse(s2));
      if (s3) setHomeworkList(JSON.parse(s3));
      if (s4) setExtraCurriculars(JSON.parse(s4));
    } catch (e) { console.log("Load error", e); }
  };

  const saveData = async (key, data) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const getFullDayName = (short) => {
    const map = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
    return map[short] || 'Monday';
  };

  const addSubject = () => {
    if (!subjectInput) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const day = getFullDayName(selectedDateObj.dayName);
    const updated = { ...fortnightSchedule, [selectedDateObj.weekType]: { ...fortnightSchedule[selectedDateObj.weekType], [day]: [...(fortnightSchedule[selectedDateObj.weekType][day] || []), { id: Date.now().toString(), name: subjectInput }] } };
    setFortnightSchedule(updated); saveData('fortnightSchedule', updated);
    setSubjectInput('');
  };

  const addExtra = () => {
    if (!extraInput) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const day = getFullDayName(selectedDateObj.dayName);
    const updated = { ...extraCurriculars, [day]: [...(extraCurriculars[day] || []), { id: Date.now().toString(), name: extraInput }] };
    setExtraCurriculars(updated); saveData('extraCurriculars', updated);
    setExtraInput('');
  };

  const addHomework = async () => {
    if (!homeworkInput) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dateKey = selectedDateObj.fullDate;
    const updated = { ...homeworkList, [dateKey]: [...(homeworkList[dateKey] || []), { id: Date.now().toString(), name: homeworkInput }] };
    setHomeworkList(updated); saveData('homeworkList', updated);
    const bridgeData = { 
      name: homeworkInput, 
      date: `${selectedDateObj.dayNum} ${new Date(selectedDateObj.fullDate).toLocaleDateString('en-GB', {month: 'short'})}` 
    };
    await AsyncStorage.setItem('pendingHomework', JSON.stringify(bridgeData));
    setHomeworkInput('');
  };

  const addEvent = () => {
    if (!eventInput) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const dateKey = selectedDateObj.fullDate;
    const updated = { ...specialEvents, [dateKey]: [...(specialEvents[dateKey] || []), { id: Date.now().toString(), name: eventInput }] };
    setSpecialEvents(updated); saveData('specialEvents', updated);
    setEventInput('');
  };

  const deleteItem = (type, id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const day = getFullDayName(selectedDateObj.dayName);
    if (type === 'Subject') {
      const updated = { ...fortnightSchedule, [selectedDateObj.weekType]: { ...fortnightSchedule[selectedDateObj.weekType], [day]: fortnightSchedule[selectedDateObj.weekType][day].filter(i => i.id !== id) } };
      setFortnightSchedule(updated); saveData('fortnightSchedule', updated);
    } else if (type === 'Extra') {
      const updated = { ...extraCurriculars, [day]: extraCurriculars[day].filter(i => i.id !== id) };
      setExtraCurriculars(updated); saveData('extraCurriculars', updated);
    } else if (type === 'Homework') {
      const updated = { ...homeworkList, [selectedDateObj.fullDate]: homeworkList[selectedDateObj.fullDate].filter(i => i.id !== id) };
      setHomeworkList(updated); saveData('homeworkList', updated);
    } else {
      const updated = { ...specialEvents, [selectedDateObj.fullDate]: specialEvents[selectedDateObj.fullDate].filter(i => i.id !== id) };
      setSpecialEvents(updated); saveData('specialEvents', updated);
    }
  };

  const dayNameFull = selectedDateObj ? getFullDayName(selectedDateObj.dayName) : '';
  const monthName = selectedDateObj ? new Date(selectedDateObj.fullDate).toLocaleDateString('en-GB', { month: 'short' }) : '';
  const recurring = selectedDateObj ? (fortnightSchedule[selectedDateObj.weekType][dayNameFull] || []) : [];
  const extras = selectedDateObj ? (extraCurriculars[dayNameFull] || []) : [];
  const homework = selectedDateObj ? (homeworkList[selectedDateObj.fullDate] || []) : [];
  const events = selectedDateObj ? (specialEvents[selectedDateObj.fullDate] || []) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* COMPACT CALENDAR STRIP */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarStrip}>
          {dates.map((item) => (
            <TouchableOpacity key={item.fullDate} style={[styles.dateCard, selectedDateObj?.fullDate === item.fullDate && styles.activeDateCard]} onPress={() => { setSelectedDateObj(item); Haptics.selectionAsync(); }}>
              <Text style={[styles.weekLabel, selectedDateObj?.fullDate === item.fullDate && {color: '#fff'}]}>{item.weekType === 'WeekA' ? 'A' : 'B'}</Text>
              <Text style={[styles.dayName, selectedDateObj?.fullDate === item.fullDate && {color: '#fff'}]}>{item.dayName}</Text>
              <Text style={[styles.dayNum, selectedDateObj?.fullDate === item.fullDate && {color: '#fff'}]}>{item.dayNum}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* NARROW DATE DISPLAY */}
        <View style={styles.currentDateDisplay}>
          <Text style={styles.dateDisplayText}>
            {dayNameFull}, {selectedDateObj?.dayNum} {monthName} • {selectedDateObj?.weekType === 'WeekA' ? 'Week A' : 'Week B'}
          </Text>
          <TouchableOpacity style={styles.todayBtn} onPress={() => { setSelectedDateObj(dates[0]); Haptics.selectionAsync(); }}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* SECTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Add subject..." value={subjectInput} onChangeText={setSubjectInput} />
            <TouchableOpacity style={[styles.addBtn, {backgroundColor: '#3F51B5'}]} onPress={addSubject}><Text style={styles.addText}>+</Text></TouchableOpacity>
          </View>
          {recurring.map(i => <View key={i.id} style={[styles.itemBox, {borderLeftColor: '#3F51B5'}]}><Text style={styles.itemText}>📚 {i.name}</Text><TouchableOpacity onPress={() => deleteItem('Subject', i.id)}><Text style={styles.del}>✕</Text></TouchableOpacity></View>)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#2E7D32'}]}>Extra Curricular</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Add activity..." value={extraInput} onChangeText={setExtraInput} />
            <TouchableOpacity style={[styles.addBtn, {backgroundColor: '#2E7D32'}]} onPress={addExtra}><Text style={styles.addText}>+</Text></TouchableOpacity>
          </View>
          {extras.map(i => <View key={i.id} style={[styles.itemBox, {borderLeftColor: '#2E7D32'}]}><Text style={styles.itemText}>🏃 {i.name}</Text><TouchableOpacity onPress={() => deleteItem('Extra', i.id)}><Text style={styles.del}>✕</Text></TouchableOpacity></View>)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#C2185B'}]}>Homework</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Add homework..." value={homeworkInput} onChangeText={setHomeworkInput} />
            <TouchableOpacity style={[styles.addBtn, {backgroundColor: '#C2185B'}]} onPress={addHomework}><Text style={styles.addText}>+</Text></TouchableOpacity>
          </View>
          {homework.map(i => <View key={i.id} style={[styles.itemBox, {borderLeftColor: '#C2185B'}]}><Text style={styles.itemText}>📖 {i.name}</Text><TouchableOpacity onPress={() => deleteItem('Homework', i.id)}><Text style={styles.del}>✕</Text></TouchableOpacity></View>)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#E65100'}]}>Special Events</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Add event..." value={eventInput} onChangeText={setEventInput} />
            <TouchableOpacity style={[styles.addBtn, {backgroundColor: '#E65100'}]} onPress={addEvent}><Text style={styles.addText}>+</Text></TouchableOpacity>
          </View>
          {events.map(i => <View key={i.id} style={[styles.itemBox, {borderLeftColor: '#E65100'}]}><Text style={styles.itemText}>⭐ {i.name}</Text><TouchableOpacity onPress={() => deleteItem('Event', i.id)}><Text style={styles.del}>✕</Text></TouchableOpacity></View>)}
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFBF4' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  calendarStrip: { flexDirection: 'row', marginBottom: 12 },
  dateCard: { width: 44, height: 60, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#F0EFEA' },
  activeDateCard: { backgroundColor: '#5D4037', borderColor: '#5D4037' },
  weekLabel: { fontSize: 9, color: '#999', fontWeight: '700' },
  dayName: { fontSize: 10, color: '#666', fontWeight: '600' },
  dayNum: { fontSize: 17, fontWeight: '800' },
  currentDateDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F0EFEA' },
  dateDisplayText: { fontSize: 14, color: '#5D4037', fontWeight: '700' },
  todayBtn: { backgroundColor: '#5D4037', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  todayBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#5D4037', marginBottom: 8 },
  inputRow: { flexDirection: 'row', marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#DDD', fontSize: 14 },
  addBtn: { width: 40, height: 40, marginLeft: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addText: { color: 'white', fontSize: 22, fontWeight: '600' },
  itemBox: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderWidth: 1, borderColor: '#F0F0F0' },
  itemText: { fontSize: 14, color: '#333', fontWeight: '600' },
  del: { color: '#E57373', fontWeight: '700', fontSize: 16, paddingLeft: 10 }
});