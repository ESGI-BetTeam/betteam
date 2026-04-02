import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typo } from '@/theme';
import { State } from '@/components/ui/State';

export function ComponentScreen() {
  return (
    <SafeAreaView style={styles.safe}>
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

        <Text style={typo.h2}>States :</Text>
        <View style={styles.componentsContainer}>
          <State variant="active" label='En Cours'/>
          <State variant="live" isAnimated/>
          <State variant="soon"/>
          <State variant="finished"/>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background},
  container: { flex: 1, padding: spacing.lg },
  componentsContainer: { marginLeft: 40, marginRight: 40, marginBottom : 30 },
});
