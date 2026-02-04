/**
 * POST /api/story-graph/demo
 * 
 * Generates demo story data for visualization testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateGraph, initializeGraphSchema, clearGraph } from '@/lib/agents/story-knowledge-graph';
import type { StoryAnalysisResult } from '@/lib/agents/story-intelligence-core';

// Demo story: "The Enchanted Kingdom"
const generateDemoData = (): StoryAnalysisResult[] => {
  const baseTime = Date.now();
  
  return [
    // Chapter 1: The Prophecy
    {
      chapterId: `chapter_1_${baseTime}`,
      chapterNumber: 1,
      version: 1,
      timestamp: new Date().toISOString(),
      summary: "In the kingdom of Aethoria, young Elena discovers she is the prophesied Dragon Keeper, destined to restore balance between humans and dragons.",
      characters: [
        { id: 'char_elena_1', name: 'Elena', role: 'protagonist', description: 'A 17-year-old village girl with silver hair and violet eyes', traits: ['brave', 'curious', 'compassionate'] },
        { id: 'char_marcus_1', name: 'Marcus', role: 'supporting', description: 'Elena\'s childhood friend and skilled archer', traits: ['loyal', 'protective', 'skilled'] },
        { id: 'char_aldric_1', name: 'King Aldric', role: 'supporting', description: 'The aging king of Aethoria', traits: ['wise', 'concerned', 'just'] },
        { id: 'char_seraphina_1', name: 'Seraphina', role: 'supporting', description: 'Ancient oracle who lives in the Crystal Cave', traits: ['mysterious', 'prophetic', 'ethereal'] },
        { id: 'char_vex_1', name: 'Lord Vex', role: 'antagonist', description: 'Dark sorcerer seeking to control all dragons', traits: ['ambitious', 'cunning', 'ruthless'] },
      ],
      locations: [
        { id: 'loc_aethoria_1', name: 'Aethoria', type: 'exterior', description: 'A magical kingdom where humans and dragons once lived in harmony' },
        { id: 'loc_willowbrook_1', name: 'Willowbrook Village', type: 'exterior', description: 'Elena\'s home village at the edge of the Whispering Woods', containedIn: 'Aethoria' },
        { id: 'loc_crystal_cave_1', name: 'Crystal Cave', type: 'interior', description: 'Sacred cave where the oracle Seraphina dwells' },
        { id: 'loc_castle_1', name: 'Royal Castle', type: 'interior', description: 'The seat of power in Aethoria' },
      ],
      objects: [
        { id: 'obj_amulet_1', name: 'Dragon Amulet', type: 'macguffin', description: 'Ancient artifact that allows communication with dragons', significance: 'Key to Elena\'s powers', owner: 'Elena' },
        { id: 'obj_prophecy_scroll_1', name: 'Prophecy Scroll', type: 'document', description: 'Ancient scroll containing the Dragon Keeper prophecy', significance: 'Reveals Elena\'s destiny' },
      ],
      events: [
        { id: 'evt_discovery_1', name: 'Elena Discovers Amulet', description: 'Elena finds the Dragon Amulet in her grandmother\'s chest', type: 'revelation', characters: ['Elena'], location: 'Willowbrook Village', isTemporal: false, temporalType: 'current' },
        { id: 'evt_vision_1', name: 'First Dragon Vision', description: 'The amulet shows Elena visions of dragons in peril', type: 'revelation', characters: ['Elena'], location: 'Willowbrook Village', isTemporal: true, temporalType: 'flashforward' },
        { id: 'evt_prophecy_1', name: 'Oracle\'s Prophecy', description: 'Seraphina reveals the ancient prophecy to Elena', type: 'revelation', characters: ['Elena', 'Seraphina'], location: 'Crystal Cave', isTemporal: false, temporalType: 'current' },
      ],
      relationships: [
        { id: 'rel_1', source: 'Elena', sourceType: 'Character', target: 'Marcus', targetType: 'Character', type: 'friends_with', description: 'Childhood friends', sentiment: 'positive', strength: 0.9 },
        { id: 'rel_2', source: 'Elena', sourceType: 'Character', target: 'Dragon Amulet', targetType: 'Object', type: 'owns', description: 'Elena possesses the ancient amulet', sentiment: 'positive', strength: 1.0 },
        { id: 'rel_3', source: 'Lord Vex', sourceType: 'Character', target: 'Dragon Amulet', targetType: 'Object', type: 'desires', description: 'Vex seeks to steal the amulet', sentiment: 'negative', strength: 0.95 },
        { id: 'rel_4', source: 'Seraphina', sourceType: 'Character', target: 'Crystal Cave', targetType: 'Location', type: 'resides_in', description: 'Oracle\'s dwelling', sentiment: 'neutral', strength: 1.0 },
      ],
      stateChanges: [
        { entityId: 'char_elena_1', entityType: 'Character', attribute: 'role', oldValue: 'village girl', newValue: 'Dragon Keeper', reason: 'Prophecy revealed' },
      ],
      temporalMarkers: [
        { id: 'temp_1', type: 'flashforward', description: 'Vision of dragons in chains', fromTime: 'present', toTime: 'future', affectedEvents: ['First Dragon Vision'] },
      ],
      plotThreads: [
        { id: 'plot_prophecy_1', name: 'The Dragon Keeper Prophecy', description: 'Elena\'s journey to fulfill her destiny', status: 'introduced', relatedCharacters: ['Elena', 'Seraphina'], relatedEvents: ['Oracle\'s Prophecy'] },
        { id: 'plot_vex_1', name: 'Vex\'s Dark Scheme', description: 'Lord Vex\'s plot to control all dragons', status: 'introduced', relatedCharacters: ['Lord Vex'], relatedEvents: [] },
      ],
      context: {
        activeCharacters: ['Elena', 'Marcus', 'King Aldric', 'Seraphina', 'Lord Vex'],
        currentLocation: 'Crystal Cave',
        currentTimeline: 'present',
        recentEvents: ['evt_discovery_1', 'evt_vision_1', 'evt_prophecy_1'],
        openPlotThreads: ['plot_prophecy_1', 'plot_vex_1'],
        mood: 'mysterious',
        tension: 'medium'
      }
    },
    // Chapter 2: Journey Begins
    {
      chapterId: `chapter_2_${baseTime}`,
      chapterNumber: 2,
      version: 1,
      timestamp: new Date().toISOString(),
      summary: "Elena and Marcus begin their journey to Dragon's Peak, encountering the mysterious dragon Pyrrhus who becomes Elena's first dragon ally.",
      characters: [
        { id: 'char_elena_2', name: 'Elena', role: 'protagonist', description: 'The prophesied Dragon Keeper', traits: ['brave', 'determined', 'growing'] },
        { id: 'char_marcus_2', name: 'Marcus', role: 'supporting', description: 'Elena\'s loyal companion', traits: ['loyal', 'protective', 'skilled'] },
        { id: 'char_pyrrhus_2', name: 'Pyrrhus', role: 'supporting', description: 'Ancient fire dragon, last of the Elder Dragons', traits: ['wise', 'powerful', 'cautious'] },
        { id: 'char_shadow_2', name: 'Shadow Assassin', role: 'antagonist', description: 'Mysterious figure sent by Vex', traits: ['silent', 'deadly', 'obedient'] },
      ],
      locations: [
        { id: 'loc_whispering_woods_2', name: 'Whispering Woods', type: 'exterior', description: 'Enchanted forest between Willowbrook and Dragon\'s Peak' },
        { id: 'loc_dragons_peak_2', name: 'Dragon\'s Peak', type: 'exterior', description: 'Sacred mountain where dragons make their home' },
        { id: 'loc_pyrrhus_lair_2', name: 'Pyrrhus\'s Lair', type: 'interior', description: 'Ancient cavern filled with dragon fire crystals', containedIn: 'Dragon\'s Peak' },
      ],
      objects: [
        { id: 'obj_dragon_amulet_2', name: 'Dragon Amulet', type: 'macguffin', description: 'Glows brighter as Elena nears dragons', significance: 'Connection to dragon kind', owner: 'Elena' },
        { id: 'obj_shadow_dagger_2', name: 'Shadow Dagger', type: 'weapon', description: 'Enchanted blade that can wound dragons', significance: 'Threat to dragons', owner: 'Shadow Assassin' },
        { id: 'obj_fire_crystal_2', name: 'Fire Crystal', type: 'symbolic', description: 'Gift from Pyrrhus to Elena', significance: 'Symbol of dragon alliance', owner: 'Elena' },
      ],
      events: [
        { id: 'evt_woods_attack_2', name: 'Ambush in the Woods', description: 'Shadow Assassin attacks Elena and Marcus', type: 'conflict', characters: ['Elena', 'Marcus', 'Shadow Assassin'], location: 'Whispering Woods', isTemporal: false, temporalType: 'current' },
        { id: 'evt_first_flight_2', name: 'Elena\'s First Dragon Flight', description: 'Pyrrhus saves Elena and takes her flying', type: 'action', characters: ['Elena', 'Pyrrhus'], location: 'Dragon\'s Peak', isTemporal: false, temporalType: 'current' },
        { id: 'evt_bond_2', name: 'Dragon Bond Formed', description: 'Elena and Pyrrhus form a telepathic bond', type: 'revelation', characters: ['Elena', 'Pyrrhus'], location: 'Pyrrhus\'s Lair', isTemporal: false, temporalType: 'current' },
        { id: 'evt_memory_2', name: 'Pyrrhus\'s Memory', description: 'Elena sees the Great Dragon War through Pyrrhus\'s memories', type: 'revelation', characters: ['Elena', 'Pyrrhus'], location: 'Pyrrhus\'s Lair', isTemporal: true, temporalType: 'flashback' },
      ],
      relationships: [
        { id: 'rel_5', source: 'Elena', sourceType: 'Character', target: 'Pyrrhus', targetType: 'Character', type: 'bonded_with', description: 'Dragon-rider bond', sentiment: 'positive', strength: 0.85 },
        { id: 'rel_6', source: 'Shadow Assassin', sourceType: 'Character', target: 'Lord Vex', targetType: 'Character', type: 'serves', description: 'Assassin sent by Vex', sentiment: 'negative', strength: 1.0 },
        { id: 'rel_7', source: 'Marcus', sourceType: 'Character', target: 'Elena', targetType: 'Character', type: 'protects', description: 'Marcus defends Elena from assassin', sentiment: 'positive', strength: 0.95 },
        { id: 'rel_8', source: 'Pyrrhus', sourceType: 'Character', target: 'Pyrrhus\'s Lair', targetType: 'Location', type: 'resides_in', description: 'Dragon\'s ancient home', sentiment: 'neutral', strength: 1.0 },
      ],
      stateChanges: [
        { entityId: 'char_elena_2', entityType: 'Character', attribute: 'abilities', oldValue: 'untrained', newValue: 'dragon bonded', reason: 'Formed bond with Pyrrhus' },
        { entityId: 'char_marcus_2', entityType: 'Character', attribute: 'status', oldValue: 'uninjured', newValue: 'wounded', reason: 'Injured protecting Elena' },
      ],
      temporalMarkers: [
        { id: 'temp_2', type: 'flashback', description: 'The Great Dragon War, 500 years ago', fromTime: 'present', toTime: '500 years ago', affectedEvents: ['Pyrrhus\'s Memory'] },
      ],
      plotThreads: [
        { id: 'plot_prophecy_2', name: 'The Dragon Keeper Prophecy', description: 'Elena gains her first dragon ally', status: 'developing', relatedCharacters: ['Elena', 'Pyrrhus'], relatedEvents: ['Dragon Bond Formed'] },
        { id: 'plot_vex_2', name: 'Vex\'s Dark Scheme', description: 'Vex sends assassins after Elena', status: 'developing', relatedCharacters: ['Lord Vex', 'Shadow Assassin'], relatedEvents: ['Ambush in the Woods'] },
        { id: 'plot_love_2', name: 'Unspoken Love', description: 'Marcus\'s growing feelings for Elena', status: 'introduced', relatedCharacters: ['Marcus', 'Elena'], relatedEvents: [] },
      ],
      context: {
        activeCharacters: ['Elena', 'Marcus', 'Pyrrhus', 'Shadow Assassin'],
        currentLocation: 'Pyrrhus\'s Lair',
        currentTimeline: 'present',
        recentEvents: ['evt_woods_attack_2', 'evt_first_flight_2', 'evt_bond_2', 'evt_memory_2'],
        openPlotThreads: ['plot_prophecy_2', 'plot_vex_2', 'plot_love_2'],
        mood: 'adventurous',
        tension: 'high'
      }
    },
    // Chapter 3: The Dark Fortress
    {
      chapterId: `chapter_3_${baseTime}`,
      chapterNumber: 3,
      version: 1,
      timestamp: new Date().toISOString(),
      summary: "Elena discovers that Lord Vex has captured three dragons and is draining their magic. She must infiltrate his fortress to free them.",
      characters: [
        { id: 'char_elena_3', name: 'Elena', role: 'protagonist', description: 'Growing into her role as Dragon Keeper', traits: ['brave', 'powerful', 'compassionate'] },
        { id: 'char_pyrrhus_3', name: 'Pyrrhus', role: 'supporting', description: 'Elena\'s dragon ally', traits: ['wise', 'protective', 'powerful'] },
        { id: 'char_luna_3', name: 'Luna', role: 'supporting', description: 'Young moonlight dragon, captive of Vex', traits: ['frightened', 'gentle', 'hopeful'] },
        { id: 'char_storm_3', name: 'Storm', role: 'supporting', description: 'Tempest dragon, captive of Vex', traits: ['angry', 'fierce', 'vengeful'] },
        { id: 'char_vex_3', name: 'Lord Vex', role: 'antagonist', description: 'Revealed to be a former dragon rider corrupted by dark magic', traits: ['powerful', 'bitter', 'tragic'] },
        { id: 'char_lyra_3', name: 'Lyra', role: 'supporting', description: 'Spy within Vex\'s fortress, former knight', traits: ['cunning', 'brave', 'mysterious'] },
      ],
      locations: [
        { id: 'loc_shadow_fortress_3', name: 'Shadow Fortress', type: 'interior', description: 'Vex\'s dark stronghold built on corrupted dragon bones' },
        { id: 'loc_dragon_prison_3', name: 'Dragon Prison', type: 'interior', description: 'Underground chambers where dragons are held and drained', containedIn: 'Shadow Fortress' },
        { id: 'loc_throne_room_3', name: 'Dark Throne Room', type: 'interior', description: 'Where Vex draws power from dragon essence', containedIn: 'Shadow Fortress' },
      ],
      objects: [
        { id: 'obj_drain_device_3', name: 'Soul Drain Device', type: 'macguffin', description: 'Magical apparatus that extracts dragon essence', significance: 'Source of Vex\'s power', owner: 'Lord Vex' },
        { id: 'obj_key_3', name: 'Dragon Prison Key', type: 'prop', description: 'Enchanted key to release dragons', significance: 'Needed to free captive dragons', owner: 'Lord Vex' },
        { id: 'obj_map_3', name: 'Fortress Map', type: 'document', description: 'Secret map of fortress passages', significance: 'Enables infiltration', owner: 'Lyra' },
      ],
      events: [
        { id: 'evt_infiltration_3', name: 'Fortress Infiltration', description: 'Elena sneaks into Shadow Fortress with Lyra\'s help', type: 'action', characters: ['Elena', 'Lyra'], location: 'Shadow Fortress', isTemporal: false, temporalType: 'current' },
        { id: 'evt_dragon_rescue_3', name: 'Dragon Rescue', description: 'Elena frees Luna and Storm from their prisons', type: 'action', characters: ['Elena', 'Luna', 'Storm'], location: 'Dragon Prison', isTemporal: false, temporalType: 'current' },
        { id: 'evt_confrontation_3', name: 'Confrontation with Vex', description: 'Elena faces Vex and learns his tragic past', type: 'conflict', characters: ['Elena', 'Lord Vex'], location: 'Dark Throne Room', isTemporal: false, temporalType: 'current' },
        { id: 'evt_vex_past_3', name: 'Vex\'s Tragedy', description: 'Flashback reveals Vex\'s dragon partner was killed by humans', type: 'revelation', characters: ['Lord Vex'], location: 'Dark Throne Room', isTemporal: true, temporalType: 'flashback' },
        { id: 'evt_escape_3', name: 'Dramatic Escape', description: 'Pyrrhus and freed dragons help Elena escape as fortress crumbles', type: 'action', characters: ['Elena', 'Pyrrhus', 'Luna', 'Storm'], location: 'Shadow Fortress', isTemporal: false, temporalType: 'current' },
      ],
      relationships: [
        { id: 'rel_9', source: 'Elena', sourceType: 'Character', target: 'Luna', targetType: 'Character', type: 'protects', description: 'Elena rescues Luna', sentiment: 'positive', strength: 0.8 },
        { id: 'rel_10', source: 'Elena', sourceType: 'Character', target: 'Storm', targetType: 'Character', type: 'rescues', description: 'Elena frees Storm', sentiment: 'positive', strength: 0.7 },
        { id: 'rel_11', source: 'Lyra', sourceType: 'Character', target: 'Elena', targetType: 'Character', type: 'allies_with', description: 'Lyra helps Elena infiltrate', sentiment: 'positive', strength: 0.85 },
        { id: 'rel_12', source: 'Lord Vex', sourceType: 'Character', target: 'Dragons', targetType: 'Character', type: 'hates', description: 'Vex blames dragons for his loss', sentiment: 'negative', strength: 0.9 },
        { id: 'rel_13', source: 'Elena', sourceType: 'Character', target: 'Lord Vex', targetType: 'Character', type: 'pities', description: 'Elena understands Vex\'s pain', sentiment: 'ambiguous', strength: 0.5 },
      ],
      stateChanges: [
        { entityId: 'char_luna_3', entityType: 'Character', attribute: 'status', oldValue: 'captive', newValue: 'free', reason: 'Rescued by Elena' },
        { entityId: 'char_storm_3', entityType: 'Character', attribute: 'status', oldValue: 'captive', newValue: 'free', reason: 'Rescued by Elena' },
        { entityId: 'loc_shadow_fortress_3', entityType: 'Location', attribute: 'status', oldValue: 'intact', newValue: 'crumbling', reason: 'Damaged during escape' },
        { entityId: 'char_elena_3', entityType: 'Character', attribute: 'power', oldValue: 'moderate', newValue: 'growing', reason: 'Bonded with more dragons' },
      ],
      temporalMarkers: [
        { id: 'temp_3', type: 'flashback', description: 'The death of Vex\'s dragon partner, 30 years ago', fromTime: 'present', toTime: '30 years ago', affectedEvents: ['Vex\'s Tragedy'] },
      ],
      plotThreads: [
        { id: 'plot_prophecy_3', name: 'The Dragon Keeper Prophecy', description: 'Elena grows stronger with each dragon she saves', status: 'developing', relatedCharacters: ['Elena', 'Luna', 'Storm'], relatedEvents: ['Dragon Rescue'] },
        { id: 'plot_vex_3', name: 'Vex\'s Dark Scheme', description: 'Vex\'s motivations revealed but his threat remains', status: 'climax', relatedCharacters: ['Lord Vex', 'Elena'], relatedEvents: ['Confrontation with Vex'] },
        { id: 'plot_redemption_3', name: 'Path to Redemption', description: 'Can Vex be redeemed?', status: 'introduced', relatedCharacters: ['Lord Vex', 'Elena'], relatedEvents: ['Vex\'s Tragedy'] },
      ],
      context: {
        activeCharacters: ['Elena', 'Pyrrhus', 'Luna', 'Storm', 'Lord Vex', 'Lyra'],
        currentLocation: 'Shadow Fortress',
        currentTimeline: 'present',
        recentEvents: ['evt_infiltration_3', 'evt_dragon_rescue_3', 'evt_confrontation_3', 'evt_escape_3'],
        openPlotThreads: ['plot_prophecy_3', 'plot_vex_3', 'plot_redemption_3'],
        mood: 'epic',
        tension: 'critical'
      }
    }
  ];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clearExisting = false } = body;

    // Initialize schema
    await initializeGraphSchema();

    // Clear existing data if requested
    if (clearExisting) {
      await clearGraph();
    }

    // Generate and store demo data
    const demoChapters = generateDemoData();
    
    for (const chapter of demoChapters) {
      await updateGraph(chapter);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo story data generated successfully',
      chaptersCreated: demoChapters.length,
      stats: {
        characters: demoChapters.reduce((sum, ch) => sum + ch.characters.length, 0),
        locations: demoChapters.reduce((sum, ch) => sum + ch.locations.length, 0),
        events: demoChapters.reduce((sum, ch) => sum + ch.events.length, 0),
        relationships: demoChapters.reduce((sum, ch) => sum + ch.relationships.length, 0),
        plotThreads: demoChapters.reduce((sum, ch) => sum + ch.plotThreads.length, 0)
      }
    });
  } catch (error) {
    console.error('Demo generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
