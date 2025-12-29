import { useState, useMemo } from "react";
import { useSelector, shallowEqual } from "react-redux";
import type { RootState } from "@/store";

import { useFetchProjectList } from "@/hooks/useFetchProjectList";
import useFetchBlockList from "@/hooks/useFetchBlockList";
import useFetchNetverList from "@/hooks/useFetchNetverList";
import useFetchRevisionList from "@/hooks/useFetchRevisionList";

import Combobox from "@/components/shadcn-studio/combobox/combobox-01";
import type { DropdownConfig } from "@/components/shadcn-studio/combobox/combobox-01";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getCheckTool } from "@/api/getCheckTool";

const FCCheckToolPage = () => {
  // Local state for FC Check Tool selections (independent from QOR Compare)
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedNetver, setSelectedNetver] = useState<string>("");
  const [selectedRevision, setSelectedRevision] = useState<string>("");

  // State for API call and HTML result
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get lists from Redux store
  const { projectList, blockList, netverList, revisionList } =
    useSelector(
      (state: RootState) => ({
        projectList: state.projectList,
        blockList: state.blockList,
        netverList: state.netverList,
        revisionList: state.revisionList,
      }),
      shallowEqual
    );

  // Filter revision list to exclude items with "-BE"
  const filteredRevisionList = useMemo(() => {
    const list = Array.isArray(revisionList) ? revisionList : [];
    return list.filter((item: string) => !item.includes("-BE"));
  }, [revisionList]);

  // Fetch data based on local selections
  useFetchProjectList();
  useFetchBlockList(selectedProject);
  useFetchNetverList(selectedProject, selectedBlock);
  useFetchRevisionList(selectedProject, selectedBlock, selectedNetver);

  // Handlers that reset dependent values
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setSelectedBlock("");
    setSelectedNetver("");
    setSelectedRevision("");
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value);
    setSelectedNetver("");
    setSelectedRevision("");
  };

  const handleNetverChange = (value: string) => {
    setSelectedNetver(value);
    setSelectedRevision("");
  };

  const handleRevisionChange = (value: string) => {
    setSelectedRevision(value);
  };

  // Build dropdown configs
  const dropdownConfigs = useMemo<DropdownConfig[]>(
    () => [
      {
        value: selectedProject,
        placeholder: "PROJECT_NAME",
        data: (Array.isArray(projectList) ? projectList : []) as string[],
        set: handleProjectChange,
      },
      {
        value: selectedBlock,
        placeholder: "BLOCK",
        data: (Array.isArray(blockList) ? blockList : []) as string[],
        set: handleBlockChange,
      },
      {
        value: selectedNetver,
        placeholder: "NET_VER",
        data: (Array.isArray(netverList) ? netverList : []) as string[],
        set: handleNetverChange,
      },
      {
        value: selectedRevision,
        placeholder: "REVISION",
        data: filteredRevisionList as string[],
        set: handleRevisionChange,
      },
    ],
    [
      selectedProject,
      selectedBlock,
      selectedNetver,
      selectedRevision,
      projectList,
      blockList,
      netverList,
      filteredRevisionList,
    ]
  );

  // Check if all fields are selected
  const isFormComplete =
    selectedProject &&
    selectedBlock &&
    selectedNetver &&
    selectedRevision;

  // Handle OK button click
  const handleOkClick = async () => {
    if (!isFormComplete) return;

    setIsLoading(true);
    setError(null);
    setHtmlContent("");

    try {
      const html = await getCheckTool({
        project: selectedProject,
        block: selectedBlock,
        netver: selectedNetver,
        revision: selectedRevision,
        eco_num: "",
      });
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comboboxes and OK Button */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        {dropdownConfigs.map((config, index) => (
          <Combobox key={index} dropdownConfigs={[config]} />
        ))}
        <Button
          onClick={handleOkClick}
          disabled={!isFormComplete || isLoading}
          className="h-9"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Loading...
            </>
          ) : (
            "OK"
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
          {error}
        </div>
      )}

      {/* HTML Content Display */}
      {htmlContent && (
        <div
          className="flex-1 border rounded-md p-4 bg-card overflow-auto
            [&_*]:text-foreground
            [&_table]:w-full [&_table]:border-collapse
            [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left
            [&_td]:border [&_td]:border-border [&_td]:p-2
            [&_tr:hover]:bg-muted/50
            [&_a]:text-primary [&_a]:underline
            [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-auto
            [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2
            [&_p]:mb-2
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
            [&_hr]:border-border [&_hr]:my-4"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
};

export default FCCheckToolPage;
