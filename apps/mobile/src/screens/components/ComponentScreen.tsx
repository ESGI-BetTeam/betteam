import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typo } from '@/theme';

// Components
import { Button } from '@/components/ui/Button';
import { State } from '@/components/ui/State';
import { Segment } from '@/components/ui/Segment';

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

        <Text style={typo.h2}>Segment :</Text>
        <View style={styles.componentsContainer}>
          <Segment
            options={[
              {label: "Test 1 blablablabla", value: "test1"},
              {label: "Test 2", value: "test2"},
              {label: "Test 3", value: "test3"},
            ]}
            value='test1'
            onChange={(value: string) => console.log(value)}
          />
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
    marginLeft: 30,
    marginRight: 30,
    marginBottom : 30
  },
});
