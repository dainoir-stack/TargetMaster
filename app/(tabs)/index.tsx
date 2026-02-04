import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView, Platform, SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const isFocused = useIsFocused();
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(0);
  const [inputText, setInputText] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState({});
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [deadlineLabel, setDeadlineLabel] = useState('Select Date');

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    if (isFocused) {
    loadAppData(); // This pulls the fresh points from AsyncStorage
    checkForNewHomework();
  }
}, [isFocused]);

const loadAppData = async () => {
  try {
    const savedTasks = await AsyncStorage.getItem('tasks');
    const savedPoints = await AsyncStorage.getItem('points');
    
    // If savedPoints is null (because we deleted it), set local state to 0
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    setPoints(savedPoints ? parseInt(savedPoints) : 0); 
  } catch (e) { 
    console.error(e); }
  };

  const checkForNewHomework = async () => {
    const pendingHW = await AsyncStorage.getItem('pendingHomework');
    if (pendingHW) {
      const homework = JSON.parse(pendingHW);
      const newTask = { id: Date.now().toString(), text: homework.name, deadline: homework.date, completed: false, subtasks: [] };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      await AsyncStorage.removeItem('pendingHomework');
    }
  };

  const saveAll = async (newTasks, newPoints, historyEntry = null) => {
    setTasks(newTasks);
    setPoints(newPoints);
    await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    await AsyncStorage.setItem('points', newPoints.toString());

    if (historyEntry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const existingHistory = await AsyncStorage.getItem('history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [{ 
        id: Date.now().toString(), 
        ...historyEntry, 
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) 
      }, ...history];
      await AsyncStorage.setItem('history', JSON.stringify(updatedHistory.slice(0, 50)));
    }
  };

  const addTarget = () => {
    if (!inputText) return;
    const finalDeadline = deadlineLabel === 'Select Date' ? 'Anytime' : deadlineLabel;
    const newList = [...tasks, { id: Date.now().toString(), text: inputText, deadline: finalDeadline, completed: false, subtasks: [] }];
    saveAll(newList, points);
    setInputText('');
    setDeadlineLabel('Select Date');
    setDate(new Date());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const deleteTarget = (id) => {
    const newList = tasks.filter(t => t.id !== id);
    saveAll(newList, points);
  };

  const addSubtask = (parentId) => {
    if (!subtaskInputs[parentId]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = tasks.map(t => {
      if (t.id === parentId) {
        return { ...t, subtasks: [...t.subtasks, { id: Date.now().toString(), text: subtaskInputs[parentId], done: false }], completed: false };
      }
      return t;
    });
    saveAll(updated, points);
    setSubtaskInputs({ ...subtaskInputs, [parentId]: '' });
  };

  const toggleSubtask = (parentId, subId) => {
    let pointChange = 0;
    let logAction = null;
    const updated = tasks.map(task => {
      if (task.id === parentId) {
        const newSubtasks = task.subtasks.map(sub => {
          if (sub.id === subId) {
            pointChange += !sub.done ? 2 : -2;
            Haptics.selectionAsync();
            return { ...sub, done: !sub.done };
          }
          return sub;
        });
        const allDone = newSubtasks.length > 0 && newSubtasks.every(s => s.done);
        if (allDone && !task.completed) {
          pointChange += 10;
          logAction = { type: 'earn', msg: `Completed: ${task.text}`, val: '+12' };
        }
        return { ...task, subtasks: newSubtasks, completed: allDone };
      }
      return task;
    });
    saveAll(updated, points + pointChange, logAction);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDeadlineLabel(selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.pointsText}>{points}</Text>
        <Text style={styles.pointsLabel}>Total Points</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <FlatList 
          data={tasks} 
          keyExtractor={(item) => item.id} 
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={
            <View style={styles.inputBox}>
              <Text style={styles.sectionTitle}>Set New Target</Text>
              <TextInput style={styles.mainInput} placeholder="What is the goal?" value={inputText} onChangeText={setInputText} />
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPicker(true)}>
                  <Text style={styles.dateSelectorText}>📅 {deadlineLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={addTarget}>
                  <Text style={styles.addBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
              {showPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} minimumDate={new Date()} />
                  {Platform.OS === 'ios' && <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.doneBtn}><Text style={styles.doneBtnText}>Done</Text></TouchableOpacity>}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{flex: 1}}>
                  <Text style={[styles.taskTitle, item.completed && styles.titleDone]}>{item.completed ? '✅' : '🎯'} {item.text}</Text>
                  <Text style={styles.deadlineText}>Due: {item.deadline}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteTarget(item.id)}><Text style={styles.delLink}>✕</Text></TouchableOpacity>
              </View>
              {item.subtasks.map(sub => (
                <TouchableOpacity key={sub.id} style={styles.subtaskRow} onPress={() => toggleSubtask(item.id, sub.id)}>
                  <Text style={[styles.subText, sub.done && styles.subDone]}>{sub.done ? '🟢' : '⚪'} {sub.text}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.subInputArea}>
                <TextInput style={styles.subInput} placeholder="Add steps..." value={subtaskInputs[item.id] || ''} onChangeText={(val) => setSubtaskInputs({...subtaskInputs, [item.id]: val})} />
                <TouchableOpacity style={styles.subAddBtn} onPress={() => addSubtask(item.id)}><Text style={{color:'white', fontWeight:'700'}}>+</Text></TouchableOpacity>
              </View>
            </View>
          )} 
          ListFooterComponent={<View style={{height: 100}} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFBF4' },
  header: { backgroundColor: '#FFD700', marginTop: 10, marginHorizontal: 20, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  pointsText: { fontSize: 38, fontWeight: '800', color: '#5D4037' },
  pointsLabel: { fontSize: 13, fontWeight: '600', color: '#5D4037', marginTop: -4 },
  listPadding: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#5D4037', marginBottom: 12 },
  inputBox: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#F0EFEA' },
  mainInput: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row' },
  dateSelector: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, justifyContent: 'center' },
  dateSelectorText: { color: '#333', fontSize: 13, fontWeight: '600' },
  addBtn: { backgroundColor: '#5D4037', marginLeft: 8, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: 'white', fontWeight: '700' },
  pickerContainer: { backgroundColor: 'white', marginTop: 10 },
  doneBtn: { padding: 10, borderTopWidth: 1, borderTopColor: '#EEE' },
  doneBtnText: { color: '#2196F3', fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0EFEA' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  titleDone: { color: '#AAA', textDecorationLine: 'line-through' },
  deadlineText: { fontSize: 11, color: '#D84315', fontWeight: '700', marginTop: 2 },
  delLink: { color: '#E57373', fontSize: 18, fontWeight: '700' },
  subtaskRow: { paddingVertical: 8, paddingLeft: 8 },
  subText: { fontSize: 14, fontWeight: '600', color: '#444' },
  subDone: { textDecorationLine: 'line-through', color: '#AAA' },
  subInputArea: { flexDirection: 'row', marginTop: 8 },
  subInput: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 6, paddingHorizontal: 10, height: 35, borderWidth: 1, borderColor: '#EEE' },
  subAddBtn: { backgroundColor: '#5D4037', marginLeft: 5, width: 35, height: 35, borderRadius: 6, justifyContent: 'center', alignItems: 'center' }
});