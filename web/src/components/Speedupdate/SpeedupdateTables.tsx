import { useContext } from "react";
import { SpeedupdateRPC } from "context/Speedupdate";
import SpeedupdateOptions from "components/Speedupdate/Options";
import VersionsTable from "components/Speedupdate/VersionsTable";
import PackagesTable from "components/Speedupdate/PackagesTable";
import BinariesTable from "components/Speedupdate/BinariesTable";
import { useSpeedupdateStatus } from "utils/useSpeedupdateStatus";
import { Platforms } from "gen/speedupdate_pb";
import { type RepoType } from "utils/platforms";

interface Props {
  binaryType: RepoType;
  platforms: Platforms[];
  onError: (err: string | null) => void;
}

export default function SpeedupdateTables({ binaryType, platforms, onError }: Props) {
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
    buildPath,
    setBuildPath,
    uploadPath,
    setUploadPath,
    error,
    setError,
  } = useSpeedupdateStatus(binaryType, platforms);

  return (
    <>
      <SpeedupdateOptions
        binaryType={binaryType}
        currentRepo={currentRepo}
        setCurrentRepo={setCurrentRepo}
        setPlatformsEnum={setPlatformsEnum}
        currentVer={currentVer}
        size={size}
        buildPath={buildPath}
        setBuildPath={setBuildPath}
        uploadPath={uploadPath}
        setUploadPath={setUploadPath}
        error={error}
        setError={setError}
      />
      <VersionsTable
        client={client}
        currentRepo={currentRepo}
        listVersions={listVersions}
        type={binaryType}
        onError={onError}
      />
      <PackagesTable
        client={client}
        currentRepo={currentRepo}
        listPackages={listPackages}
        type={binaryType}
        onError={onError}
      />
      <BinariesTable
        client={client}
        currentRepo={currentRepo}
        availableBinaries={availableBinaries}
        type={binaryType}
        onError={onError}
      />
    </>
  );
}
