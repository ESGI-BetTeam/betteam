import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typo } from '@/theme';

// Components
import { Button } from '@/components/ui/Button';
import { State } from '@/components/ui/State';

export function ComponentScreen() {
  return (
    <ScrollView style={styles.safe}>
      <View style={styles.container}>
        <Text style={typo.h1}>Components</Text>

        <Text style={typo.h2}>Typo :</Text>
        <View style={styles.componentsContainer}>
          <Text style={typo.h1}>Heading 1</Text>
          <Text style={typo.h2}>Heading 2</Text>
          <Text style={typo.h3}>Heading 3</Text>
          <Text style={typo.h4}>Heading 4</Text>
          <Text style={typo.p}>Paragraph</Text>
          <Text style={typo.pBold}>Paragraph bold</Text>
          <Text style={typo.pMuted}>Paragraph muted</Text>
          <Text style={typo.small}>Small paragraph</Text>
        </View>

        <Text style={typo.h2}>Button :</Text>
        <View style={styles.componentsContainer}>
          <Button title="Primary" variant="primary" onPress={() => console.log("clicked")} />
          <Button title="Secondary" variant="secondary" onPress={() => console.log("clicked")} />
          <Button title="Danger" variant="danger" onPress={() => console.log("clicked")} />
          <Button title="Outline" variant="outline" onPress={() => console.log("clicked")} />
          <Button title="Ghost" variant="ghost" onPress={() => console.log("clicked")} />
          <Button title="Primary loading" variant="primary" loading={true} onPress={() => console.log("clicked")} />
          <Button title="Primary large" variant="primary" size='large' onPress={() => console.log("clicked")} />
        </View>

        <Text style={typo.h2}>States :</Text>
        <View style={styles.componentsContainer}>
          <State variant="active" label='En Cours'/>
          <State variant="live" isAnimated/>
          <State variant="soon"/>
          <State variant="finished"/>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    padding: spacing.lg
  },
  componentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10',
    marginLeft: 40,
    marginRight: 40,
    marginBottom : 30
  },
});
