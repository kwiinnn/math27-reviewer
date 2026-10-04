import { getTopicBySlug } from './data/registry';
import { homeHref, useRoute } from './lib/router';
import { Layout } from './components/Layout';
import { FormulaReferencePage } from './pages/FormulaReferencePage';
import { OverviewPage } from './pages/OverviewPage';
import { TopicPage } from './pages/TopicPage';

export default function App() {
  const route = useRoute();
  const topic = route.page === 'topic' ? getTopicBySlug(route.slug) : undefined;

  return (
    <Layout route={route} topic={topic}>
      {route.page === 'home' && <OverviewPage />}
      {route.page === 'formula-reference' && <FormulaReferencePage />}
      {route.page === 'topic' && topic && <TopicPage key={`${topic.id}-${route.view}`} topic={topic} view={route.view} />}
      {route.page === 'topic' && !topic && (
        <p className="text-sm">
          That unit does not exist. <a className="underline underline-offset-4" href={homeHref}>Go to the overview</a>.
        </p>
      )}
    </Layout>
  );
}
