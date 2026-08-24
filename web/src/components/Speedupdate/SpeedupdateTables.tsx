import { useContext } from "react";
import { SpeedupdateRPC } from "context/Speedupdate";
import SpeedupdateOptions from "components/Speedupdate/Options";
import VersionsTable from "components/Speedupdate/VersionsTable";
import PackagesTable from "components/Speedupdate/PackagesTable";
import BinariesTable from "components/Speedupdate/BinariesTable";
import { useSpeedupdateStatus } from "utils/useSpeedupdateStatus";

interface Props {
  binaryType: "game" | "launcher";
  onError:    (err: string | null) => void;
}

export default function SpeedupdateTables({ binaryType, onError }: Props) {
  const client = useContext(SpeedupdateRPC);

  const {
    currentRepo,
    setCurrentRepo,
    setPlatformsEnum,
    listVersions,
    listPackages,
    availableBinaries,
    currentVer,
    size,
    error,
    setError,
  } = useSpeedupdateStatus(binaryType);

  return (
    <>
      <SpeedupdateOptions
        binaryType={binaryType}
        currentRepo={currentRepo}
        setCurrentRepo={setCurrentRepo}
        setPlatformsEnum={setPlatformsEnum}
        currentVer={currentVer}
        size={size}
        error={error}
        setError={setError}
      />
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
