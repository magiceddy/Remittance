import { all } from 'redux-saga/effects';
import setTreshholdSaga from './setTrashholdSaga';


export default function* sagas() {
  yield all([
    setTreshholdSaga(),
  ]);
}
