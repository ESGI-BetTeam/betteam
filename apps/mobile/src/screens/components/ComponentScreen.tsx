import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';

import { colors, spacing, typo } from '@/theme';

// Components
import { Button } from '@/components/ui/Button';
import { State } from '@/components/ui/State';
import { Segment } from '@/components/ui/Segment';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { InputNumber } from '@/components/ui/InputNumber';
import { Avatar } from '@/components/ui/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { LeagueCard } from '@/components/ui/LeagueCard';
import { MatchCard } from '@/components/ui/MatchCard';
import { SportFilter } from '@/components/ui/SportFilter';
import { Timeline } from '@/components/ui/Timeline';

export function ComponentScreen() {
  const timelineCountStep = 4;
  const [timelineStep, setTimelineStep] = useState(1);
  const [timelineIsDone, setTimelineIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (timelineStep >= timelineCountStep) {
        setTimelineIsDone(true);
      } else {
        setTimelineStep(prev => prev + 1);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [timelineStep]);

  // Reset after "done" animation
  useEffect(() => {
    if (!timelineIsDone) return;
    const timer = setTimeout(() => {
      setTimelineIsDone(false);
      setTimelineStep(1);
    }, 9000);

    return () => clearTimeout(timer);
  }, [timelineIsDone]);

  return (
    <ScrollView style={styles.safe}>
      <View style={styles.container}>
        <Text style={typo.h1}>Components</Text>

        

        <Text style={typo.h2}>Timeline :</Text>
        <View style={styles.componentsContainer}>
          <Timeline stepCount={timelineCountStep} currentStep={timelineStep} done={timelineIsDone} displayConfetti={true} />
        </View>

        <Text style={typo.h2}>Typo :</Text>
        <View style={styles.componentsContainer}>
          <Text style={typo.h1}>Heading 1</Text>
          <Text style={typo.h2}>Heading 2</Text>
          <Text style={typo.h3}>Heading 3</Text>
          <Text style={typo.h4}>Heading 4</Text>
          <Text style={typo.p}>Paragraph</Text>
          <Text style={typo.pBold}>Paragraph bold</Text>
          <Text style={typo.pSecondary}>Paragraph secondary</Text>
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

        <Text style={typo.h2}>Tag :</Text>
        <View style={styles.componentsContainer}>
          <Tag title='Primary tag' variant='primary' />
          <Tag title='Secondary tag' variant='secondary' />
          <Tag title='Danger tag' variant='danger' />
          <Tag title='Outline tag' variant='outline' />
        </View>

        <Text style={typo.h2}>Input :</Text>
        <View style={styles.componentsContainer}>
          <Input
            label='Input text'
            placeholder='Input text'
            onChangeText={(value: string) => console.log(value)}
          />
          <Input
            label='Input password'
            placeholder='Input password'
            error='Password required'
            type='password'
          />
          <Input
            label='Input textarea'
            placeholder='Input textarea'
            type='textarea'
          />
        </View>

        <Text style={typo.h2}>Input Number :</Text>
        <View style={styles.componentsContainer}>
          <InputNumber />
        </View>

        <Text style={typo.h2}>Logo :</Text>
        <View style={[styles.componentsContainer, styles.row]}>
          <Logo width={160} height={48} />
          <Logo width={100} height={30} />
        </View>

        <Text style={typo.h2}>Avatar :</Text>
        <View style={[styles.componentsContainer, styles.row]}>
          <Avatar name="John Doe" size={40} />
          <Avatar name="Sarah L" size={48} style={{ backgroundColor: colors.secondary }} />
          <Avatar name="?" size={32} />
        </View>

        <Text style={typo.h2}>Header :</Text>
        <View style={styles.componentsContainer}>
          <Header username="JohnDoe" points={450} />
        </View>

        <Text style={typo.h2}>Section Header :</Text>
        <View style={styles.componentsContainer}>
          <SectionHeader title="Mes Ligues" actionLabel="Voir tout" onAction={() => console.log("voir tout")} />
          <SectionHeader title="Prochains Matchs" />
        </View>

        <Text style={typo.h2}>League Card :</Text>
        <View style={[styles.componentsContainer, styles.row]}>
          <LeagueCard
            name="Ligue 1"
            membersCount={42}
            rank={5}
            totalMembers={42}
            level={5}
            colorIndex={0}
            onPress={() => console.log("league pressed")}
          />
          <LeagueCard
            name="Ligue 2"
            membersCount={18}
            rank={3}
            totalMembers={18}
            colorIndex={1}
            onPress={() => console.log("league pressed")}
          />
        </View>

        <Text style={typo.h2}>Sport Filter :</Text>
        <View style={styles.componentsContainer}>
          <SportFilter
            items={[
              { key: 'soccer', label: 'Football', count: 30 },
              { key: 'ice hockey', label: 'Hockey', count: 17 },
              { key: 'basketball', label: 'Basket', count: 3 },
            ]}
            selected={null}
            onSelect={() => {}}
          />
        </View>

        <Text style={typo.h2}>Match Card (featured) :</Text>
        <View style={styles.componentsContainer}>
          <MatchCard
            homeTeam={{ name: "PSG" }}
            awayTeam={{ name: "Marseille" }}
            date={new Date().toISOString()}
            status="open"
            variant="featured"
            odds={{ home: 1.85, draw: 3.40, away: 4.20 }}
            onPress={() => console.log("pronostiquer")}
          />
        </View>

        <Text style={typo.h2}>Match Card (compact) :</Text>
        <View style={styles.componentsContainer}>
          <MatchCard
            homeTeam={{ name: "Lyon" }}
            awayTeam={{ name: "Monaco" }}
            date={new Date(Date.now() + 86400000).toISOString()}
            status="open"
            variant="compact"
            odds={{ home: 2.10, draw: 3.20, away: 3.50 }}
          />
        </View>
        <Text style={typo.h2}>Timeline :</Text>
        <View style={styles.componentsContainer}>
          <Timeline stepCount={timelineCountStep} currentStep={timelineStep} done={timelineIsDone} displayConfetti={true} />
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
    gap: 10,
    marginLeft: 30,
    marginRight: 30,
    marginBottom : 30
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
