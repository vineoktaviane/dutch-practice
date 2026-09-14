import './styles.css';
import './pwa';
import './ui/events'; // registers the click/change/keydown listeners
import { TOPICS } from './data';
import { GEN, TOTAL } from './generators';
import { loadFactStates, loadSettings, loadStats } from './platform/storage';
import { initSpeech } from './platform/speech';
import { setSoundEnabled } from './platform/sound';
import { allFacts } from './srs/facts';
import { $, $opt, paintHeader } from './ui/dom';
import { S, factStates } from './ui/state';
import { repaintQuestion } from './ui/quiz';
import { renderHome, renderTopic } from './ui/screens';

/* ---------- static chrome ---------- */
$('totalCount').textContent = TOTAL.toLocaleString('en-US') + '+';
const topicCount = $opt('topicCount');
if (topicCount) topicCount.textContent = String(TOPICS.length);
$('footTotals').textContent =
  `Question pool: ${TOTAL.toLocaleString('en-US')} unique combinations across ${TOPICS.length} topics.`;

/* ---------- stored state ---------- */
/* A deep link renders a live quiz before these resolve, so anything already
   answered must survive the load rather than be replaced by the stored copy. */
loadStats().then((s) => {
  if (!S.stats.answered) S.stats = s;
  paintHeader();
  if (S.view.page === 'home') renderHome();
});
/* Facts whose vocabulary has since been removed from the word banks would sit
   in the queue forever: no generator can render them, so they never get graded
   and their due date never moves. Drop them as they load. */
const liveFacts = new Set(Object.values(allFacts()).flat());
loadFactStates().then((list) => {
  for (const st of list) if (liveFacts.has(st.id) && !factStates.has(st.id)) factStates.set(st.id, st);
  if (S.view.page === 'home') renderHome(); // review card needs the due count
});
loadSettings().then((s) => {
  S.settings = s;
  setSoundEnabled(s.sound !== false);
  // a quiz opened by deep link was painted before this landed, so the saved
  // answer mode and sound toggle would otherwise be stuck on the defaults
  if (S.view.page !== 'home' && $opt('quizBox') && !$opt('fb')?.innerHTML) repaintQuestion();
});
initSpeech();

/* ---------- first screen ---------- */
/* boot-time deep link, e.g. #/quiz/dehet or #/learn/perfect */
const deepLink = location.hash.match(/^#\/(learn|quiz)\/([a-z]+)$/);
if (deepLink && (GEN[deepLink[2]] || deepLink[2] === 'mix')) {
  S.view = { page: 'topic', topic: deepLink[2], tab: deepLink[1] as 'learn' | 'quiz' };
  renderTopic();
} else {
  renderHome();
}
