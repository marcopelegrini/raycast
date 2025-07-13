import { useState, useEffect } from "react";
import { Detail, getSelectedFinderItems } from "@raycast/api";
import { HelloPage } from "./components/Home";
import { ConverterForm } from "./components/ConverterForm";
import { getHandBrakeCLIPath } from "./handBrake/handBrakeCLI";

export default function Command() {
  const [initialFinderFiles, setInitialFinderFiles] = useState<string[]>([]);
  const [handBrakeCLIPath, setHandBrakeCLIPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const cliPath = await getHandBrakeCLIPath();
        setHandBrakeCLIPath(cliPath);
        
        if (cliPath) {
          try {
            const finderItems = await getSelectedFinderItems();
            setInitialFinderFiles(finderItems.map((item) => item.path));
          } catch (finderError) {
            console.warn("Could not get selected Finder items:", finderError);
            setInitialFinderFiles([]);
          }
        }
      } catch (error) {
        console.warn("Could not get HandBrakeCLI path:", error);
        setHandBrakeCLIPath(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return isLoading ? (
    <Detail isLoading={true} />
  ) : handBrakeCLIPath ? (
    <ConverterForm initialFiles={initialFinderFiles} />
  ) : (
    <HelloPage onContinue={(path) => setHandBrakeCLIPath(path)} />
  );
}
