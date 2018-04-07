import { Vector3 } from 'three';

export const getWorldPosition = (object, target) => 
  target.setFromMatrixPosition(object.matrixWorld);

export const getWorldDistance = (function () {
  const a = new Vector3();
  const b = new Vector3();
  return (obj1, obj2) => {
    getWorldPosition(obj1, a);
    getWorldPosition(obj2, b);
    return a.distanceTo(b);
  };
})();
