// src/components/ListaCercaTuyo.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import {
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTema } from "../tema/TemaContext";
import { Lugar } from "../tipos/lugar";
import { obtenerInfoCategoria } from "../utils/categorias";
import { formatearDistancia } from "../utils/distancias";
import Texto from "./ui/Texto";

export interface LugarConDistancia extends Lugar {
  distanciaMetros: number;
}

interface ListaCercaTuyoProps {
  lugares: LugarConDistancia[];
}

const RADIO_HOJA = 28;
const RESORTE = { damping: 24, stiffness: 220, mass: 0.9 };

function masCercano(valor: number, puntos: number[]): number {
  "worklet";
  let mejor = puntos[0];
  for (let i = 1; i < puntos.length; i++) {
    if (Math.abs(puntos[i] - valor) < Math.abs(mejor - valor)) {
      mejor = puntos[i];
    }
  }
  return mejor;
}

// Al tocar la cabecera: si está abierta se cierra y si está cerrada se abre.
function siguientePunto(actual: number, puntos: number[]): number {
  "worklet";
  let indice = 0;
  for (let i = 1; i < puntos.length; i++) {
    if (Math.abs(puntos[i] - actual) < Math.abs(puntos[indice] - actual)) {
      indice = i;
    }
  }
  return puntos[indice === 0 ? puntos.length - 1 : indice - 1];
}

export function ListaCercaTuyo({ lugares }: ListaCercaTuyoProps) {
  const router = useRouter();
  const { colores } = useTema();
  const { height } = useWindowDimensions();

  // La cabecera crece si el usuario agranda la letra del sistema.
  const altoCabecera = Math.round(
    36 + 40 * Math.min(PixelRatio.getFontScale(), 1.6),
  );
  const altoHoja = Math.max(Math.round(height * 0.45), altoCabecera + 160);

  // 0 = abierta · segundo valor = cerrada (solo se ve la cabecera)
  const puntos = [0, altoHoja - altoCabecera];

  const traslado = useSharedValue(puntos[1]);
  const inicioArrastre = useSharedValue(0);

  const estiloHoja = useAnimatedStyle(() => ({
    transform: [{ translateY: traslado.get() }],
  }));

  const estiloFlecha = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          traslado.get(),
          [0, puntos[1]],
          [180, 0],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const gestoArrastre = Gesture.Pan()
    .onStart(() => {
      inicioArrastre.set(traslado.get());
    })
    .onUpdate((evento) => {
      const nuevo = inicioArrastre.get() + evento.translationY;
      traslado.set(Math.min(Math.max(nuevo, puntos[0]), puntos[1]));
    })
    .onEnd((evento) => {
      const proyectado = traslado.get() + evento.velocityY * 0.15;
      traslado.set(withSpring(masCercano(proyectado, puntos), RESORTE));
    });

  const gestoToque = Gesture.Tap().onEnd(() => {
    traslado.set(withSpring(siguientePunto(traslado.get(), puntos), RESORTE));
  });

  const gestoCabecera = Gesture.Exclusive(gestoArrastre, gestoToque);

  function alternarAccesible() {
    traslado.set(withSpring(siguientePunto(traslado.get(), puntos), RESORTE));
  }

  if (lugares.length === 0) return null;

  return (
    <Animated.View
      style={[
        estilos.hoja,
        { backgroundColor: colores.superficie, height: altoHoja },
        estiloHoja,
      ]}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={gestoCabecera}>
          <View
            accessible
            role="button"
            accessibilityLabel="Lugares cerca tuyo"
            accessibilityHint="Doble toque para abrir o cerrar la lista"
            accessibilityActions={[{ name: "activate" }]}
            onAccessibilityAction={alternarAccesible}
            style={[estilos.cabecera, { height: altoCabecera }]}
          >
            <View
              style={[estilos.manija, { backgroundColor: colores.borde }]}
            />

            <View style={estilos.cabeceraFila}>
              <View
                style={[
                  estilos.iconoHoja,
                  { backgroundColor: colores.primarioSuave },
                ]}
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color={colores.primarioFuerte}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Texto style={{ fontSize: 16, fontWeight: "700" }}>
                  Cerca tuyo
                </Texto>
                <Texto style={{ fontSize: 12, color: colores.textoSecundario }}>
                  Los lugares más cercanos a donde estás
                </Texto>
              </View>

              <Animated.View style={estiloFlecha}>
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={colores.primarioFuerte}
                />
              </Animated.View>
            </View>
          </View>
        </GestureDetector>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {lugares.map((lugar) => {
            const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);

            return (
              <Pressable
                key={lugar.id}
                style={[estilos.fila, { borderTopColor: colores.borde }]}
                onPress={() => router.push(`/lugares/${lugar.id}` as any)}
                role="button"
                accessibilityLabel={`${lugar.nombre}${
                  lugar.coordenadas
                    ? `, a ${formatearDistancia(lugar.distanciaMetros)}`
                    : ""
                }`}
              >
                <View
                  style={[
                    estilos.circuloIcono,
                    { backgroundColor: `${color}20` },
                  ]}
                >
                  <Ionicons name={icono} size={18} color={color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Texto
                    numberOfLines={1}
                    style={{ fontSize: 15, fontWeight: "700" }}
                  >
                    {lugar.nombre}
                  </Texto>
                  <Texto
                    numberOfLines={1}
                    style={{ fontSize: 13, color: colores.textoSecundario }}
                  >
                    {lugar.descripcionCorta}
                  </Texto>
                </View>

                {lugar.coordenadas ? (
                  <View
                    style={[
                      estilos.distancia,
                      { backgroundColor: colores.primarioSuave },
                    ]}
                  >
                    <Texto
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colores.primarioFuerte,
                      }}
                    >
                      {formatearDistancia(lugar.distanciaMetros)}
                    </Texto>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </GestureHandlerRootView>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  hoja: {
    position: "absolute",
    zIndex: 10,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIO_HOJA,
    borderTopRightRadius: RADIO_HOJA,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
  },
  cabecera: { overflow: "hidden" },
  manija: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  cabeceraFila: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconoHoja: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fila: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  circuloIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  distancia: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
