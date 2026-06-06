package iad1tya.echo.music.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import iad1tya.echo.music.ui.theme.bbhBartle
import kotlinx.coroutines.delay
import kotlin.math.sin
import kotlin.random.Random

@Composable
fun WordsworthSplashScreen(onSplashComplete: () -> Unit) {

    var phase by remember { mutableIntStateOf(0) }
    // 0 = black, 1 = lightning builds, 2 = YVL appears, 3 = glow peak, 4 = fade out

    val screenAlpha by animateFloatAsState(
        targetValue = if (phase >= 4) 0f else 1f,
        animationSpec = tween(700, easing = FastOutLinearInEasing),
        label = "fade"
    )
    val textAlpha by animateFloatAsState(
        targetValue = if (phase >= 2) 1f else 0f,
        animationSpec = tween(400, easing = LinearOutSlowInEasing),
        label = "textAlpha"
    )
    val textScale by animateFloatAsState(
        targetValue = if (phase >= 2) 1f else 0.6f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow),
        label = "textScale"
    )
    val glowRadius by animateFloatAsState(
        targetValue = when (phase) {
            3 -> 320f
            2 -> 200f
            else -> 0f
        },
        animationSpec = tween(600, easing = LinearOutSlowInEasing),
        label = "glow"
    )
    val glowAlpha by animateFloatAsState(
        targetValue = when (phase) {
            3 -> 0.35f
            2 -> 0.18f
            else -> 0f
        },
        animationSpec = tween(600),
        label = "glowAlpha"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "lightning")
    val lightningFlicker by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(80, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "flicker"
    )

    LaunchedEffect(Unit) {
        delay(200)
        phase = 1   // lightning starts
        delay(700)
        phase = 2   // YVL appears
        delay(300)
        phase = 3   // glow peak
        delay(1500)
        phase = 4   // fade out
        delay(750)
        onSplashComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .alpha(screenAlpha),
        contentAlignment = Alignment.Center
    ) {

        // Lightning + glow canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            val cx = size.width / 2f
            val cy = size.height / 2f

            // Radial glow bloom
            if (glowRadius > 0f) {
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color(0xFFFFFFFF).copy(alpha = glowAlpha),
                            Color(0xFFCCCCFF).copy(alpha = glowAlpha * 0.4f),
                            Color.Transparent
                        ),
                        center = Offset(cx, cy),
                        radius = glowRadius
                    ),
                    radius = glowRadius,
                    center = Offset(cx, cy)
                )
            }

            // Lightning bolts (only during phase 1-3)
            if (phase in 1..3) {
                val baseAlpha = (0.4f + lightningFlicker * 0.6f).coerceIn(0f, 1f)
                drawLightningBolt(cx, cy - 80f, cx - 120f, cy + 200f, Color(0xFFFFFFFF), baseAlpha)
                drawLightningBolt(cx, cy - 80f, cx + 130f, cy + 190f, Color(0xFFAADDFF), baseAlpha * 0.75f)
                drawLightningBolt(cx - 60f, cy - 180f, cx + 40f, cy + 220f, Color(0xFFFFFFFF), baseAlpha * 0.55f)
                // Horizontal arc
                drawArc(cx - 100f, cy - 60f, cx + 100f, Color(0xFFCCEEFF), baseAlpha * 0.4f)
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // YVL main title
            Text(
                text = "YVL",
                style = TextStyle(
                    fontFamily = bbhBartle,
                    fontWeight = FontWeight.Normal,
                    fontSize = 96.sp,
                    letterSpacing = 8.sp,
                    color = Color.White
                ),
                modifier = Modifier
                    .alpha(textAlpha)
                    .graphicsLayer {
                        scaleX = textScale
                        scaleY = textScale
                    }
            )

            Spacer(Modifier.height(8.dp))

            // Tagline
            Text(
                text = "music",
                style = TextStyle(
                    fontFamily = FontFamily.Default,
                    fontWeight = FontWeight.Light,
                    fontSize = 13.sp,
                    letterSpacing = 8.sp,
                    color = Color.White.copy(alpha = 0.45f)
                ),
                modifier = Modifier.alpha(textAlpha)
            )

            Spacer(Modifier.height(52.dp))

            // Credit
            val creditAlpha by animateFloatAsState(
                targetValue = if (phase >= 3) 0.6f else 0f,
                animationSpec = tween(800),
                label = "credit"
            )
            Text(
                text = "by Shourya",
                style = TextStyle(
                    fontFamily = FontFamily.Cursive,
                    fontWeight = FontWeight.Light,
                    fontSize = 14.sp,
                    letterSpacing = 2.sp,
                    color = Color.White.copy(alpha = creditAlpha)
                )
            )
        }
    }
}

private fun DrawScope.drawLightningBolt(
    startX: Float, startY: Float,
    endX: Float, endY: Float,
    color: Color, alpha: Float
) {
    val path = Path()
    path.moveTo(startX, startY)
    val steps = 8
    val dx = (endX - startX) / steps
    val dy = (endY - startY) / steps
    for (i in 1..steps) {
        val jitter = if (i == steps) 0f else (Random.nextFloat() - 0.5f) * 60f
        path.lineTo(startX + dx * i + jitter, startY + dy * i)
    }
    drawPath(
        path = path,
        color = color.copy(alpha = alpha),
        style = Stroke(width = 2.5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    )
    // Glow pass
    drawPath(
        path = path,
        color = color.copy(alpha = alpha * 0.25f),
        style = Stroke(width = 8f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    )
}

private fun DrawScope.drawArc(
    x1: Float, y: Float, x2: Float, color: Color, alpha: Float
) {
    val path = Path()
    path.moveTo(x1, y)
    val mid = (x1 + x2) / 2f
    path.cubicTo(x1 + 20f, y - 30f, mid, y - 50f, mid + 10f, y - 20f)
    path.cubicTo(mid + 20f, y + 10f, x2 - 20f, y - 20f, x2, y)
    drawPath(
        path = path,
        color = color.copy(alpha = alpha),
        style = Stroke(width = 2f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    )
}
