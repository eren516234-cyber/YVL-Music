package iad1tya.echo.music.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.*

data class GlobePoint(
    val lat: Float,
    val lon: Float,
    val label: String,
    val isHighlighted: Boolean = false,
    val genre: String = ""
)

private val sampleGlobePoints = listOf(
    GlobePoint(40.7f, -74.0f, "New York", true, "Hip-Hop"),
    GlobePoint(51.5f, -0.1f, "London", true, "Rock"),
    GlobePoint(35.7f, 139.7f, "Tokyo", true, "J-Pop"),
    GlobePoint(48.9f, 2.3f, "Paris", false, "Electronic"),
    GlobePoint(-33.9f, 151.2f, "Sydney", false, "Indie"),
    GlobePoint(19.4f, -99.1f, "Mexico City", false, "Latin"),
    GlobePoint(-23.5f, -46.6f, "São Paulo", false, "Samba"),
    GlobePoint(55.8f, 37.6f, "Moscow", false, "Classical"),
    GlobePoint(28.6f, 77.2f, "Delhi", false, "Bollywood"),
    GlobePoint(37.6f, 127.0f, "Seoul", true, "K-Pop"),
    GlobePoint(-26.2f, 28.0f, "Johannesburg", false, "Afrobeat"),
    GlobePoint(30.0f, 31.2f, "Cairo", false, "Arabic Pop"),
)

@Composable
fun MusicGlobeScreen(
    onDismiss: () -> Unit = {}
) {
    var rotationY by remember { mutableFloatStateOf(0f) }
    var rotationX by remember { mutableFloatStateOf(20f) }
    var selectedPoint by remember { mutableStateOf<GlobePoint?>(null) }

    val infiniteTransition = rememberInfiniteTransition(label = "globe_auto_rotate")
    val autoRotate by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(30000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "auto_rotate"
    )
    var isDragging by remember { mutableStateOf(false) }
    val effectiveRotationY = if (isDragging) rotationY else (rotationY + autoRotate) % 360f

    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow_pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Ambient glow behind globe
        Box(
            modifier = Modifier
                .size(320.dp)
                .align(Alignment.Center)
                .offset(y = (-30).dp)
                .blur(80.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.06f * glowPulse),
                            Color.Transparent
                        )
                    ),
                    CircleShape
                )
        )

        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(52.dp))

            // Title
            Text(
                text = "MUSIC GLOBE",
                style = TextStyle(
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    letterSpacing = 6.sp,
                    color = Color.White
                )
            )
            Text(
                text = "trending around the world",
                style = TextStyle(
                    fontWeight = FontWeight.Light,
                    fontSize = 11.sp,
                    letterSpacing = 2.sp,
                    color = Color.White.copy(alpha = 0.4f)
                )
            )

            Spacer(Modifier.height(20.dp))

            // Globe Canvas
            Canvas(
                modifier = Modifier
                    .size(300.dp)
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { isDragging = true },
                            onDragEnd = { isDragging = false },
                            onDragCancel = { isDragging = false },
                            onDrag = { _, dragAmount ->
                                rotationY += dragAmount.x * 0.3f
                                rotationX = (rotationX - dragAmount.y * 0.2f).coerceIn(-60f, 60f)
                            }
                        )
                    }
            ) {
                drawGlobe(
                    effectiveRotationY = effectiveRotationY,
                    rotationX = rotationX,
                    points = sampleGlobePoints,
                    glowPulse = glowPulse,
                    onPointSelected = { selectedPoint = it }
                )
            }

            Spacer(Modifier.height(24.dp))

            // Selected point info card
            selectedPoint?.let { point ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 32.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White.copy(alpha = 0.06f))
                        .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 24.dp, vertical = 16.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = point.label,
                            style = TextStyle(
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp,
                                color = Color.White
                            )
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = point.genre,
                            style = TextStyle(
                                fontWeight = FontWeight.Normal,
                                fontSize = 13.sp,
                                color = Color.White.copy(alpha = 0.5f),
                                letterSpacing = 2.sp
                            )
                        )
                    }
                }
            } ?: Box(
                modifier = Modifier
                    .padding(horizontal = 32.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 24.dp, vertical = 16.dp)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Drag to explore · tap a city",
                    style = TextStyle(
                        fontWeight = FontWeight.Light,
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.3f),
                        letterSpacing = 1.sp
                    ),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(28.dp))

            // Genre legend dots
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(horizontal = 20.dp)
            ) {
                sampleGlobePoints.filter { it.isHighlighted }.forEach { point ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.08f))
                            .clickable { selectedPoint = point }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(Color.White, CircleShape)
                        )
                        Text(
                            text = point.genre,
                            style = TextStyle(
                                fontSize = 11.sp,
                                color = Color.White.copy(alpha = 0.7f),
                                letterSpacing = 0.5.sp
                            )
                        )
                    }
                }
            }
        }

        // Dismiss button
        IconButton(
            onClick = onDismiss,
            modifier = Modifier
                .padding(16.dp)
                .align(Alignment.TopStart)
                .background(Color.White.copy(alpha = 0.08f), CircleShape)
        ) {
            Text("✕", color = Color.White, fontSize = 16.sp)
        }
    }
}

private fun DrawScope.drawGlobe(
    effectiveRotationY: Float,
    rotationX: Float,
    points: List<GlobePoint>,
    glowPulse: Float,
    onPointSelected: (GlobePoint) -> Unit
) {
    val cx = size.width / 2f
    val cy = size.height / 2f
    val radius = size.minDimension / 2f - 8f

    // Outer glow ring
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(
                Color.White.copy(alpha = 0.03f * glowPulse),
                Color.Transparent
            ),
            center = Offset(cx, cy),
            radius = radius * 1.15f
        ),
        radius = radius * 1.15f,
        center = Offset(cx, cy)
    )

    // Globe base sphere with subtle gradient
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(
                Color(0xFF1A1A1A),
                Color(0xFF0A0A0A)
            ),
            center = Offset(cx - radius * 0.25f, cy - radius * 0.25f),
            radius = radius * 1.2f
        ),
        radius = radius,
        center = Offset(cx, cy)
    )

    // Globe border
    drawCircle(
        color = Color.White.copy(alpha = 0.15f),
        radius = radius,
        center = Offset(cx, cy),
        style = Stroke(width = 1f)
    )

    // Latitude lines
    val latSteps = 6
    for (i in 1 until latSteps) {
        val lat = -90f + i * (180f / latSteps)
        val latRad = Math.toRadians(lat.toDouble()).toFloat()
        val r = radius * cos(latRad)
        val yOff = radius * sin(latRad)
        val tiltRad = Math.toRadians(rotationX.toDouble()).toFloat()
        val projY = yOff * cos(tiltRad)
        val projR = r
        if (projR > 0) {
            drawCircle(
                color = Color.White.copy(alpha = 0.04f),
                radius = projR,
                center = Offset(cx, cy + projY),
                style = Stroke(width = 0.8f)
            )
        }
    }

    // Longitude lines
    val lonSteps = 12
    for (i in 0 until lonSteps) {
        val lon = i * (360f / lonSteps)
        drawLongitudeLine(cx, cy, radius, lon, effectiveRotationY, rotationX)
    }

    // City points
    val tiltRad = Math.toRadians(rotationX.toDouble()).toFloat()
    val rotYRad = Math.toRadians(effectiveRotationY.toDouble()).toFloat()

    for (point in points) {
        val latRad = Math.toRadians(point.lat.toDouble()).toFloat()
        val lonRad = Math.toRadians(point.lon.toDouble()).toFloat()

        val x3d = cos(latRad) * cos(lonRad)
        val y3d = sin(latRad)
        val z3d = cos(latRad) * sin(lonRad)

        val rotatedX = x3d * cos(rotYRad) + z3d * sin(rotYRad)
        val rotatedZ = -x3d * sin(rotYRad) + z3d * cos(rotYRad)

        val finalX = rotatedX
        val finalY = y3d * cos(tiltRad) - rotatedZ * sin(tiltRad)
        val finalZ = y3d * sin(tiltRad) + rotatedZ * cos(tiltRad)

        if (finalZ < -0.1f) continue

        val screenX = cx + finalX * radius
        val screenY = cy - finalY * radius
        val depth = (finalZ + 1f) / 2f

        val dotRadius = if (point.isHighlighted) 5f + 2f * glowPulse else 3f
        val alpha = 0.5f + depth * 0.5f

        if (point.isHighlighted) {
            drawCircle(
                color = Color.White.copy(alpha = 0.25f * glowPulse),
                radius = dotRadius * 2.5f,
                center = Offset(screenX, screenY)
            )
        }

        drawCircle(
            color = Color.White.copy(alpha = alpha),
            radius = dotRadius,
            center = Offset(screenX, screenY)
        )

        if (depth > 0.6f && point.isHighlighted) {
            drawContext.canvas.nativeCanvas.apply {
                val paint = android.graphics.Paint().apply {
                    color = android.graphics.Color.argb((alpha * 180).toInt(), 255, 255, 255)
                    textSize = 22f
                    isAntiAlias = true
                    typeface = android.graphics.Typeface.create(
                        android.graphics.Typeface.DEFAULT,
                        android.graphics.Typeface.BOLD
                    )
                }
                drawText(point.label, screenX + 8f, screenY - 6f, paint)
            }
        }
    }

    // Highlight ring at equator
    drawCircle(
        color = Color.White.copy(alpha = 0.08f),
        radius = radius,
        center = Offset(cx, cy),
        style = Stroke(width = 0.5f)
    )

    // Specular highlight (top-left)
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(
                Color.White.copy(alpha = 0.08f),
                Color.Transparent
            ),
            center = Offset(cx - radius * 0.35f, cy - radius * 0.35f),
            radius = radius * 0.5f
        ),
        radius = radius * 0.5f,
        center = Offset(cx - radius * 0.35f, cy - radius * 0.35f)
    )
}

private fun DrawScope.drawLongitudeLine(
    cx: Float, cy: Float, radius: Float,
    lon: Float, rotationY: Float, rotationX: Float
) {
    val path = Path()
    val steps = 36
    val tiltRad = Math.toRadians(rotationX.toDouble()).toFloat()
    val rotYRad = Math.toRadians((lon + rotationY).toDouble()).toFloat()
    var first = true

    for (i in 0..steps) {
        val latRad = Math.toRadians(-90.0 + i * (180.0 / steps)).toFloat()
        val x3d = cos(latRad)
        val y3d = sin(latRad)

        val rotatedX = x3d * cos(rotYRad)
        val rotatedZ = x3d * sin(rotYRad)

        val finalX = rotatedX
        val finalY = y3d * cos(tiltRad) - rotatedZ * sin(tiltRad)
        val finalZ = y3d * sin(tiltRad) + rotatedZ * cos(tiltRad)

        if (finalZ < 0) {
            first = true
            continue
        }

        val screenX = cx + finalX * radius
        val screenY = cy - finalY * radius

        if (first) {
            path.moveTo(screenX, screenY)
            first = false
        } else {
            path.lineTo(screenX, screenY)
        }
    }

    drawPath(
        path = path,
        color = Color.White.copy(alpha = 0.04f),
        style = Stroke(width = 0.7f)
    )
}
