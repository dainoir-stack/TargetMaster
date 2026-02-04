import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function StoreScreen() {
  const isFocused = useIsFocused();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const defaultRewards = [
    { id: '1', name: 'Gaming Time (30 mins)', cost: 50, emoji: '🎮' },
    { id: '2', name: 'Later Bedtime (1 hour)', cost: 100, emoji: '🌙' },
    { id: '3', name: 'Weekend Movie Trip', cost: 500, emoji: '🍿' },
  ];

  const [rewards, setRewards] = useState(defaultRewards);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎁');

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      const p = await AsyncStorage.getItem('points');
      const h = await AsyncStorage.getItem('history');
      const r = await AsyncStorage.getItem('customRewards');
      if (p) setPoints(parseInt(p));
      if (h) setHistory(JSON.parse(h));
      if (r) setRewards(r ? JSON.parse(r) : defaultRewards);
    } catch (e) { console.log(e); }
  };

  const addReward = async () => {
    if (!newName || !newCost) return;
    const newItem = { id: Date.now().toString(), name: newName, cost: parseInt(newCost), emoji: newEmoji };
    const updated = [...rewards, newItem];
    setRewards(updated);
    await AsyncStorage.setItem('customRewards', JSON.stringify(updated));
    setNewName(''); setNewCost('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ONLY RESETS POINTS AND HISTORY
  const resetWallet = () => {
    Alert.alert(
      "Reset Points?", 
      "This will set points to 0 and clear your activity history. Targets and Planner data will not be touched.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Points", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('points');
            await AsyncStorage.removeItem('history');
            setPoints(0);
            setHistory([]);
            setIsAdmin(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } 
        }
      ]
    );
  };

  const processPurchase = async (reward) => {
    const newPoints = points - reward.cost;
    const newEntry = {
      id: Date.now().toString(), type: 'spend',
      msg: `Claimed: ${reward.name}`, val: `-${reward.cost}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    };
    const newHistory = [newEntry, ...history].slice(0, 15);
    setPoints(newPoints);
    setHistory(newHistory);
    await AsyncStorage.setItem('points', newPoints.toString());
    await AsyncStorage.setItem('history', JSON.stringify(newHistory));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.pointsText}>{points}</Text>
        <Text style={styles.pointsLabel}>Available Points</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <TouchableOpacity 
            style={[styles.inlineEditBtn, isAdmin && styles.activeEditBtn]} 
            onPress={() => setIsAdmin(!isAdmin)}
          >
            <Text style={[styles.inlineEditBtnText, isAdmin && {color: '#FFF'}]}>
              {isAdmin ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <View style={styles.adminBox}>
            <Text style={styles.adminLabel}>Wallet Control</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetWallet}>
              <Text style={styles.resetBtnText}>Reset Points & History</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <Text style={styles.adminLabel}>Add New Reward</Text>
            <TextInput style={styles.input} placeholder="Reward Name" value={newName} onChangeText={setNewName} />
            <View style={styles.inputRow}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Cost" keyboardType="numeric" value={newCost} onChangeText={setNewCost} />
              <TouchableOpacity style={styles.addBtnAction} onPress={addReward}>
                <Text style={{color:'white', fontWeight:'700'}}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {rewards.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, points < item.cost && !isAdmin && styles.locked]} 
            onPress={() => {
              if (isAdmin) {
                Alert.alert("Delete?", "Remove this?", [
                  {text: "Cancel"},
                  {text: "Delete", onPress: () => {
                    const up = rewards.filter(r => r.id !== item.id);
                    setRewards(up);
                    AsyncStorage.setItem('customRewards', JSON.stringify(up));
                  }}
                ]);
              } else if (points >= item.cost) {
                Alert.alert("Redeem?", `Spend ${item.cost}?`, [
                  {text: "Cancel"},
                  {text: "Redeem", onPress: () => processPurchase(item)}
                ]);
              }
            }}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cost}>{item.cost} pts</Text>
            </View>
            {!isAdmin && (
              <View style={[styles.buyBtn, points < item.cost && {backgroundColor: '#DDD'}]}>
                <Text style={styles.buyBtnText}>{points >= item.cost ? 'Get' : '🔒'}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Recent Activity</Text>
        {history.map(item => (
          <View key={item.id} style={styles.histRow}>
            <Text style={styles.histMsg}>{item.msg}</Text>
            <Text style={[styles.histVal, {color: item.type === 'earn' ? '#2E7D32' : '#C62828'}]}>{item.val}</Text>
          </View>
        ))}
        <View style={{height: 80}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFBF4' },
  header: { backgroundColor: '#FFD700', marginTop: 10, marginHorizontal: 20, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  pointsText: { fontSize: 38, fontWeight: '800', color: '#5D4037' },
  pointsLabel: { fontSize: 13, fontWeight: '600', color: '#5D4037', marginTop: -4 },
  container: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#5D4037' },
  inlineEditBtn: { backgroundColor: '#EFEBE9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  activeEditBtn: { backgroundColor: '#5D4037' },
  inlineEditBtnText: { fontSize: 12, fontWeight: '600', color: '#5D4037' },
  adminBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#5D4037' },
  adminLabel: { fontSize: 10, fontWeight: '800', color: '#5D4037', opacity: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  resetBtn: { backgroundColor: '#FFEBEE', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 12 },
  resetBtnText: { color: '#C62828', fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  input: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, marginBottom: 8, fontSize: 14 },
  inputRow: { flexDirection: 'row' },
  addBtnAction: { backgroundColor: '#5D4037', marginLeft: 8, paddingHorizontal: 15, height: 40, borderRadius: 8, justifyContent: 'center' },
  card: { backgroundColor: 'white', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#F0EFEA' },
  locked: { opacity: 0.6 },
  emoji: { fontSize: 24, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#333' },
  cost: { fontSize: 13, color: '#D84315', fontWeight: '700' },
  buyBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8 },
  buyBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  histMsg: { fontSize: 14, color: '#555', fontWeight: '500' },
  histVal: { fontWeight: '700', fontSize: 14 }
});