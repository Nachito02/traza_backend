-- La mano de obra dejó de calcularse por rol/tarifa: ahora sale del legajo de
-- Personal (personal_bodega) y de los operarios transitorios. La tabla
-- tarifa_mano_obra quedó sin uso, se elimina. El enum RolManoObra se conserva
-- porque lo sigue usando personal_bodega.rol.
DROP TABLE IF EXISTS "tarifa_mano_obra";
