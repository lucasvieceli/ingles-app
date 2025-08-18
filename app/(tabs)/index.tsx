import { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type WordResult = {
  word: string;
  correct: boolean;
};

export default function HomeScreen() {
  const [phrase, setPhrase] = useState('');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<WordResult[]>([]);

  const fetchPhrase = async () => {
    try {
      const { text } = await generateText({
        model: deepseek('deepseek-chat'),
        prompt: 'Generate a short English sentence with about five words.',
        apiKey: process.env.DEEPSEEK_API_KEY,
      });

      setPhrase(text.trim());
      setInput('');
      setResult([]);
    } catch (err) {
      console.error('Failed to fetch phrase', err);
    }
  };

  useEffect(() => {
    fetchPhrase();
  }, []);

  const speak = () => {
    Speech.speak(phrase, { language: 'en' });
  };

  const submit = () => {
    const phraseWords = phrase.trim().split(/\s+/);
    const inputWords = input.trim().split(/\s+/);
    const compared = phraseWords.map((word, idx) => ({
      word,
      correct: inputWords[idx]?.toLowerCase() === word.toLowerCase(),
    }));
    setResult(compared);
  };

  const renderPhrase = () => {
    if (result.length === 0) {
      return <ThemedText style={styles.phrase}>{phrase}</ThemedText>;
    }

    return (
      <View style={styles.phraseWords}>
        {result.map(({ word, correct }, idx) => (
          <ThemedText
            key={idx}
            style={[styles.phrase, { color: correct ? 'green' : 'red' }]}
          >
            {word}
          </ThemedText>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.phraseRow}>
        {renderPhrase()}
        <Button title="🔊" onPress={speak} />
      </View>
      <TextInput
        value={input}
        onChangeText={setInput}
        style={styles.input}
        placeholder="Type what you hear"
      />
      {result.length === 0 ? (
        <Button title="Enviar" onPress={submit} />
      ) : (
        <Button title="Próxima frase" onPress={fetchPhrase} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 16,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phrase: {
    fontSize: 24,
  },
  phraseWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
});

