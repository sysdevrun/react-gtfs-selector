import { GtfsSelector } from 'react-gtfs-selector';
import type { GtfsSelectionResult } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';

function App() {
  const handleSelect = (result: GtfsSelectionResult) => {
    switch (result.type) {
      case 'file': {
        // User dropped or picked a .zip file
        const { blob, fileName } = result;
        console.log(`File: ${fileName} (${blob.size} bytes)`);

        // Example: read as ArrayBuffer for parsing
        blob.arrayBuffer().then((buffer) => {
          // Pass buffer to a GTFS parser...
        });
        break;
      }

      case 'url': {
        // User selected an online dataset or entered a URL
        const { url, title, gtfsRtUrls } = result;
        console.log(`Dataset: ${title}`);
        console.log(`Download URL: ${url}`);

        if (gtfsRtUrls?.length) {
          console.log('GTFS-RT feeds:', gtfsRtUrls);
        }

        // Example: fetch the GTFS zip from the URL
        fetch(url)
          .then((res) => res.arrayBuffer())
          .then((buffer) => {
            // Pass buffer to a GTFS parser...
          });
        break;
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Select a GTFS source</h1>
      <GtfsSelector onSelect={handleSelect} />
    </div>
  );
}

export default App;
