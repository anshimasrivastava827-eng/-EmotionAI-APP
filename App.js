
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';


const API_URL = "http://10.48.108.112:8080/EmotionAI/send_message.php";

export default function App() {

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hi! I'm EmotionAI 💜 Your friendly AI companion. How are you feeling today?",
      sender: 'ai',
      emotion: 'Friendly'
    }
  ]);


  const sendMessage = async () => {

    if (!message.trim() || loading) return;

    const userText = message.trim();

    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText
        })
      });

      const data = await response.json();

      console.log("Backend Response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'ai',
        emotion: data.emotion || 'Neutral'
      };

      setMessages(prev => [...prev, aiMessage]);

    }

    catch (error) {

      console.log("API Error:", error);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "Sorry, I couldn't connect right now. Please try again. 💜",
          sender: 'ai'
        }
      ]);

    }

    finally {
      setLoading(false);
    }

  };

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* Header */}

      <View style={styles.header}>

        <Text style={styles.logo}>
          💜 EmotionAI
        </Text>

        <Text style={styles.status}>
          ● Your AI Companion
        </Text>

      </View>

      {/* Welcome Section */}

      <View style={styles.welcome}>

        <Text style={styles.welcomeTitle}>
          How are you feeling?
        </Text>

        <Text style={styles.welcomeText}>
          Share your thoughts. I'm here for you.
        </Text>

      </View>

      {/* Chat Section */}

      <ScrollView
        style={styles.chat}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >

        {messages.map(item => (

          <View
            key={item.id}
            style={[
              styles.messageRow,
              item.sender === 'user'
                ? styles.userRow
                : styles.aiRow
            ]}
          >

            <View
              style={[
                styles.bubble,
                item.sender === 'user'
                  ? styles.userBubble
                  : styles.aiBubble
              ]}
            >

              <Text
                style={[
                  styles.messageText,
                  item.sender === 'user' && styles.userText
                ]}
              >
                {item.text}
              </Text>

              {item.emotion && (
                <Text style={styles.emotion}>
                  Emotion: {item.emotion}
                </Text>
              )}

            </View>

          </View>

        ))}

        {/* Loading Indicator */}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#7255C7" size="small" />
            <Text style={styles.loadingText}>
              EmotionAI is thinking...
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Message Input */}

      <View style={styles.inputArea}>

        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            loading && { opacity: 0.5 }
          ]}
          onPress={sendMessage}
          disabled={loading || !message.trim()}
        >

          <Text style={styles.sendText}>
            ➤
          </Text>

        </TouchableOpacity>

      </View>

      {/* Footer */}

      <Text style={styles.footer}>
        EmotionAI • A companion that listens 💜
      </Text>

    </KeyboardAvoidingView>

  );

}

// Styles

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    paddingTop: Platform.OS === 'android' ? 35 : 50
  },

  header: {
    backgroundColor: '#7255C7',
    padding: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22
  },

  logo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },

  status: {
    color: '#E9E0FF',
    marginTop: 5,
    fontSize: 13
  },

  welcome: {
    padding: 20
  },

  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#30234E'
  },

  welcomeText: {
    color: '#777',
    marginTop: 5
  },

  chat: {
    flex: 1,
    paddingHorizontal: 15
  },

  messageRow: {
    flexDirection: 'row',
    marginVertical: 7
  },

  userRow: {
    justifyContent: 'flex-end'
  },

  aiRow: {
    justifyContent: 'flex-start'
  },

  bubble: {
    maxWidth: '85%',
    padding: 13,
    borderRadius: 17
  },

  userBubble: {
    backgroundColor: '#7255C7',
    borderBottomRightRadius: 4
  },

  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAE4FA'
  },

  messageText: {
    color: '#30234E',
    fontSize: 15,
    lineHeight: 22
  },

  userText: {
    color: '#FFFFFF'
  },

  emotion: {
    color: '#9677D5',
    fontSize: 11,
    marginTop: 8
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginLeft: 10
  },

  loadingText: {
    color: '#7255C7',
    marginLeft: 10,
    fontSize: 13
  },

  inputArea: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EEE'
  },

  input: {
    flex: 1,
    backgroundColor: '#F4F1FC',
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 12,
    maxHeight: 100,
    color: '#30234E'
  },

  sendButton: {
    backgroundColor: '#7255C7',
    width: 46,
    height: 46,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 9
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 22
  },

  footer: {
    textAlign: 'center',
    padding: 8,
    fontSize: 11,
    color: '#999'
  }

});
