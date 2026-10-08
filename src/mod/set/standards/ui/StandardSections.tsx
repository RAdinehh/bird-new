/**
 * StandardSections — ترکیب BasicSections + AdvancedSections
 */
import BasicSections from './BasicSections';
import AdvancedSections from './AdvancedSections';
import type { BirdStandard } from '../types';

interface Props {
  std: BirdStandard;
  def: BirdStandard;
  isCustom: boolean;
  nameChanged: boolean;
  bioChanged: boolean;
  spaceChanged: boolean;
  envChanged: boolean;
  feedChanged: boolean;
  mortChanged: boolean;
  updateBird: (patch: Partial<BirdStandard>) => void;
}

export default function StandardSections(props: Props) {
  const { std, def, nameChanged, bioChanged, spaceChanged, envChanged, feedChanged, mortChanged, updateBird } = props;
  return (
    <>
      <BasicSections
        std={std}
        def={def}
        nameChanged={nameChanged}
        bioChanged={bioChanged}
        spaceChanged={spaceChanged}
        updateBird={updateBird}
      />
      <AdvancedSections
        std={std}
        def={def}
        envChanged={envChanged}
        feedChanged={feedChanged}
        mortChanged={mortChanged}
        updateBird={updateBird}
      />
    </>
  );
}
