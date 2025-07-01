import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  useIonModal,
  IonText,
  IonNote,
  IonContent,
  IonPage,
  IonButton,
  IonToolbar,
  IonHeader,
  IonButtons,
  IonCardSubtitle,
  IonIcon,
  useIonActionSheet,
  IonChip,
} from '@ionic/react';
import timeago from 'epoch-timeago';
import { Consideration } from '../../utils/appTypes';
import KeyChip from '../keyChip';
import { useClipboard } from '../../useCases/useClipboard';
import { ellipsisVertical, arrowForward } from 'ionicons/icons';
import {
  considerationID,
  getEmbeddedReference,
  shortenB64,
} from '../../utils/compat';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../utils/appContext';
import { OverlayEventDetail } from '@ionic/core/components';
import { KeyAbbrev } from '../keyStats';

export const ConsiderationItem: React.FC<Consideration> = (consideration) => {
  const [present, dismiss] = useIonModal(ConsiderationDetail, {
    onDismiss: () => dismiss(),
    consideration,
  });

  const { time } = consideration;

  const timeMS = time * 1000;

  return (
    <IonItem lines="none" onClick={() => present()}>
      <IonLabel className="ion-text-wrap">
        <IonText color="tertiary">
          <sub>
            <time dateTime={new Date(timeMS).toISOString()}>
              <p>{timeago(timeMS)}</p>
            </time>
          </sub>
        </IonText>
        <div>
          <IonChip outline={true}>
            <KeyAbbrev
              value={
                consideration.by ??
                '0000000000000000000000000000000000000000000='
              }
            />
          </IonChip>

          <IonIcon icon={arrowForward} />
          <IonChip outline={true}>
            <KeyAbbrev value={consideration.for} />
          </IonChip>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default ConsiderationItem;

interface ConsiderationListProps {
  heading?: string;
  considerations: Consideration[];
}

export const ConsiderationList = ({
  considerations,
  heading,
}: ConsiderationListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!considerations.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {considerations.map((tx, index) => (
        <ConsiderationItem
          key={index}
          by={tx.by}
          for={tx.for}
          memo={tx.memo}
          time={tx.time}
          nonce={tx.nonce}
          series={tx.series}
        />
      ))}
    </IonList>
  );
};

export const ConsiderationDetail = ({
  onDismiss,
  consideration,
}: {
  onDismiss: () => void;
  consideration: Consideration;
}) => {
  const { copyToClipboard } = useClipboard();

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data }: OverlayEventDetail) => {
    if (data?.['action'] === 'copy') {
      copyToClipboard(`ref/${considerationID(consideration)}/`);
    }
  };

  const { requestConsideration } = useContext(AppContext);

  const referencedConxID = getEmbeddedReference(consideration);
  const [referenced, setReferenced] = useState<Consideration>();

  useEffect(() => {
    if (!referencedConxID) return;
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      cleanup =
        requestConsideration(referencedConxID, (conx) => {
          setReferenced(conx);
        }) ?? cleanup;
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [referencedConxID, requestConsideration]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss()}>
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Considered by:{' '}
                <KeyChip
                  value={
                    consideration.by ??
                    '0000000000000000000000000000000000000000000='
                  }
                />
              </div>
              <IonButton
                className="ion-no-padding"
                fill="clear"
                onClick={() => {
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: `${shortenB64(
                      consideration.by ?? '0000000',
                    )} => ${shortenB64(consideration.for)}`,
                    buttons: [
                      {
                        text: 'Copy Reference',
                        data: {
                          action: 'copy',
                        },
                      },
                    ],
                  });
                }}
              >
                <IonIcon
                  color="primary"
                  slot="icon-only"
                  icon={ellipsisVertical}
                ></IonIcon>
              </IonButton>
            </IonCardSubtitle>
            <IonLabel>
              <IonNote>
                {new Date(consideration.time * 1000).toDateString()}
              </IonNote>
            </IonLabel>
          </IonCardHeader>
          <IonCardContent>
            <KeyChip value={consideration.for} />

            {referenced ? (
              <IonCard>
                <IonCardContent>
                  <KeyChip value={referenced.for} />
                  <p>{referenced.memo}</p>
                </IonCardContent>
              </IonCard>
            ) : (
              <p>{consideration.memo}</p>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};
