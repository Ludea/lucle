import { useContext } from "react";
import { SpeedupdateRPC } from "context/Speedupdate";
import SpeedupdateOptions from "components/Speedupdate/Options";
import VersionsTable from "views/Speedupdate/VersionsTable";
import PackagesTable from "views/Speedupdate/PackagesTable";
import BinariesTable from "views/Speedupdate/BinariesTable";
import { Versions } from "gen/speedupdate_pb";

interface Props {
  binaryType:        "game" | "launcher";
  currentRepo:       Map<string, string[]>;
  listVersions:      Versions[];
  listPackages:      { name: string; published: boolean }[];
  availableBinaries: string[];
  onError:           (err: string | null) => void;
}

export default function SpeedupdateTables({
  binaryType,
  currentRepo,
  listVersions,
  listPackages,
  availableBinaries,
  onError,
}: Props) {
  const client = useContext(SpeedupdateRPC);

  return (
    <>
      <SpeedupdateOptions binaryType={binaryType} />
      <VersionsTable
        client={client}
        currentRepo={currentRepo}
        listVersions={listVersions}
        onError={onError}
      />
      <PackagesTable
        client={client}
        currentRepo={currentRepo}
        listPackages={listPackages}
        onError={onError}
      />
      <BinariesTable
        client={client}
        currentRepo={currentRepo}
        availableBinaries={availableBinaries}
        onError={onError}
      />
    </>
  );
}
