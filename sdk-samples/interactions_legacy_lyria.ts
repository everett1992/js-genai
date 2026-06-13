/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

const MODEL_ID = 'lyria-3-clip-preview';

/**
 * Utility function to parse and log the Lyria response parts.
 * Save the audio to a file if it exists.
 */
function handleLyriaResponse(response: any, audioFileName: string) {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    console.log('No parts found in the response.');
    return;
  }

  // Filter for text parts (usually lyrics/structure)
  const textParts = parts.filter((part: any) => part.text);
  if (textParts.length >= 1) {
    console.log('\nLyrics / Structure:');
    const lyricsText = textParts[0].text;
    try {
      console.log(JSON.stringify(JSON.parse(lyricsText), null, 2));
    } catch {
      console.log(lyricsText);
    }
  }

  // Save Audio Part
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      console.log(`\nSaving audio to ${audioFileName}...`);
      fs.writeFileSync(audioFileName, Buffer.from(part.inlineData.data, 'base64'));
    }
  }
}

async function runModelsGenerateContent(ai: GoogleGenAI) {
  console.log('\n--- 1. Generate Content (First Song) ---');
  const prompt = 'Create a 30-second cheerful acoustic folk song about a sunrise in the mountains.';
  
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    config: {
      responseModalities: ['AUDIO', 'TEXT'],
    },
    contents: prompt,
  });

  handleLyriaResponse(response, 'sunrise_folk.mp3');
}

async function runImageToMusic(ai: GoogleGenAI) {
  console.log('\n--- 2. Visual Inspiration: Image-to-Music ---');
  
  // Download example image
  const imageUrl = 'https://storage.googleapis.com/generativeai-downloads/images/groceries.jpeg';
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      'An epic song with opera voices about this quest. Deep synths and a speeding up tempo.',
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ],
  });

  handleLyriaResponse(response, 'groceries_quest.mp3');
}

async function runInteractions(ai: GoogleGenAI) {
  console.log('\n--- 3. Using the Interactions API ---');

  const prompt = 'a spoken word poem';
  const interaction = await ai.interactions.create({
    model: MODEL_ID,
    input: prompt,
    response_modalities: ['audio', 'text'],
  });

  console.log('Interaction output text:', interaction.output_text);
  
  if (interaction.output_audio?.data) {
    console.log('Saving interaction audio output to spoken_word.mp3...');
    fs.writeFileSync('spoken_word.mp3', Buffer.from(interaction.output_audio.data, 'base64'));
  }
}

async function runInteractionsWithImage(ai: GoogleGenAI) {
  console.log('\n--- 4. Using Images with the Interactions API ---');

  const imageUrl = 'https://storage.googleapis.com/generativeai-downloads/images/groceries.jpeg';
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');

  const prompt = 'A movie trailer song about a kids movie illustrated by this image';
  const interaction = await ai.interactions.create({
    model: MODEL_ID,
    input: [
      { type: 'text', text: prompt },
      { type: 'image', data: base64Image, mime_type: 'image/jpeg' },
    ],
  });

  console.log('Interaction output text:', interaction.output_text);
  
  if (interaction.output_audio?.data) {
    console.log('Saving interaction audio output to groceries_trailer.mp3...');
    fs.writeFileSync('groceries_trailer.mp3', Buffer.from(interaction.output_audio.data, 'base64'));
  }
}

async function runStreamingInteractions(ai: GoogleGenAI) {
  console.log('\n--- 5. Streaming with the Interactions API ---');

  const prompt = 'Create a 30-second futuristic synthwave track at 120 BPM.';
  const stream = await ai.interactions.create({
    model: MODEL_ID,
    input: prompt,
    response_modalities: ['audio', 'text'],
    stream: true,
  });

  let textResult = '';
  const audioChunks: Buffer[] = [];

  for await (const event of stream) {
    if (event.event_type === 'step.delta') {
      if (event.delta?.type === 'text') {
        process.stdout.write(event.delta.text ?? '');
        textResult += event.delta.text ?? '';
      } else if (event.delta?.type === 'audio' && event.delta.data) {
        audioChunks.push(Buffer.from(event.delta.data, 'base64'));
      }
    }
  }
  process.stdout.write('\n');

  if (audioChunks.length > 0) {
    console.log('Saving streamed interaction audio output to synthwave_streamed.mp3...');
    fs.writeFileSync('synthwave_streamed.mp3', Buffer.concat(audioChunks));
  }
}

async function runPromptingTipsAndInstrumental(ai: GoogleGenAI) {
  console.log('\n--- 5. Prompting Tips (BPM, Timing, Structure, Lyrics) ---');

  // BPM Tip
  console.log('\nBPM Prompt:');
  const bpmPrompt = 'Create a hyper-energetic German techno track at 180 BPM. Feature a Risset accelerando illusion with overlapping, accelerating kick drums and industrial synths that sound like they are endlessly speeding up into chaotic infinity.';
  const bpmResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: bpmPrompt,
  });
  handleLyriaResponse(bpmResponse, 'techno_bpm.mp3');

  // Timing Tip
  console.log('\nTiming Prompt:');
  const timingPrompt = `
    [0:00 - 0:10] Fast acoustic guitar arpeggios, setting an energetic tone.
    [0:10 - 0:20] Add a warm Fender Rhodes piano melody.
    [0:20 - 0:30] Full band with upbeat drums and soaring synth leads.
  `;
  const timingResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: timingPrompt,
  });
  handleLyriaResponse(timingResponse, 'timing.mp3');

  // Music Structure Tip
  console.log('\nStructure Prompt:');
  const structurePrompt = `
    [Intro] Calm piano music setting a sunset scene on the beach
    [Verse] Epic rock balade as the storm rages.
    [Outro] Opera with choir as the sun reappears again through the black clouds .
  `;
  const structureResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: structurePrompt,
  });
  handleLyriaResponse(structureResponse, 'structure.mp3');

  // Intensity Control Tip
  console.log('\nIntensity Control Prompt:');
  const intensityPrompt = `
    [0:00 - 0:12] Intro: Begin atmospherically with just the Fender Rhodes playing
    soft chords (Cm7, Fm7). Drench it in warm reverb and introduce a light
    atmospheric texture. The mood is hazy, like a memory coming into focus.
    Intensity: 1/10 (Very Low)

    [0:12 - 0:24] Verse 1: The laid-back drum beat enters with a simple kick and
    snare. A soft, ethereal synth pad swells in the background. A clean, subtle
    sub-bass joins, adding depth. The Rhodes melody becomes slightly more defined
    over a | Cm7 | Fm7 | G7alt | Cm7 | progression. Intensity: 3/10 (Low)

    [0:24 - 0:36] Build: The groove deepens as a gentle, syncopated hi-hat is
    added. A simple, memorable lead melody appears, played on a warm, rounded
    synth. This section should feel like the gentle peak of the track's focus,
    flowing through an | Abmaj7 | G7alt | Cm7 | Ebmaj7 | progression. Intensity:
    5/10 (Medium)

    [0:36 - 0:48] Chorus: Gracefully pull back the intensity. The synth lead
    melody fades out, returning focus to the core Rhodes groove and the drums.
    This gives the track space to breathe over an | Fm7 | Ebmaj7 | Abmaj7 | G7alt
    | progression. Intensity: 4/10 (Medium-Low)

    [0:48 - 1:00] Outro: The drums and bass drop out completely. The track fades
    out leaving only the Rhodes playing spacious chords, the lingering synth pad,
    and the persistent atmospheric texture. Intensity: 2/10 (Very Low)
  `;
  const intensityResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: intensityPrompt,
  });
  handleLyriaResponse(intensityResponse, 'intensity_control.mp3');

  // Provide Lyrics
  console.log('\nProvide Lyrics Prompt:');
  const lyricsPrompt = `
    An uplifting song with guitar rifts about nano banana.
    The lyrics should be:
      Yellow peel, a tiny sweet, The Nano Banana, a tropical treat. But wait—it
      hums, it starts to create, Switching into AI mode. Not a fruit, but a smart
      machine, The bananiest model you've ever seen.
  `;
  const lyricsResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: lyricsPrompt,
  });
  handleLyriaResponse(lyricsResponse, 'nano_banana.mp3');

  // Let model reason lyrics
  console.log('\nModel reasoning lyrics Prompt:');
  const reasoningPrompt = 'A serious moment in a Shakespeare play';
  const reasoningResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: reasoningPrompt,
    config: {
      responseModalities: ['AUDIO', 'TEXT'],
    },
  });
  handleLyriaResponse(reasoningResponse, 'shakespeare_reasoning.mp3');

  // Multiple Languages Song
  console.log('\nMultiple Languages Prompt:');
  const multilangPrompt = 'Tell me how bubble sort works as a disco song in spanish and french.';
  const multilangResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: multilangPrompt,
  });
  handleLyriaResponse(multilangResponse, 'bubble_sort_disco.mp3');

  // Instrumental Only Tip
  console.log('\nInstrumental-only Prompt:');
  const instrumentalPrompt = 'Create a looping meditation music that feels like the wind.';
  const instrumentalResponse = await ai.models.generateContent({
    model: MODEL_ID,
    contents: instrumentalPrompt,
  });
  handleLyriaResponse(instrumentalResponse, 'meditation_instrumental.mp3');
}

async function main() {
  let ai: GoogleGenAI;
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    ai = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });
  } else {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });
  }

  try {
    await runModelsGenerateContent(ai);
    await runImageToMusic(ai);
    await runInteractions(ai);
    await runInteractionsWithImage(ai);
    await runStreamingInteractions(ai);
    await runPromptingTipsAndInstrumental(ai);
  } catch (error) {
    console.error('An error occurred during execution:', error);
  }
}

main();
