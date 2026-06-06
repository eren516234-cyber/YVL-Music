package iad1tya.echo.music.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import iad1tya.echo.music.BuildConfig
import iad1tya.echo.music.ui.theme.bbhBartle

@Composable
fun WelcomeDialog(onDismissRequest: () -> Unit) {
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier.padding(20.dp).fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 32.dp, horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                // Dark circle logo with YVL
                Box(
                    modifier = Modifier
                        .size(88.dp)
                        .clip(CircleShape)
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    // Mini lightning canvas
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val cx = size.width / 2f; val cy = size.height / 2f
                        drawLine(Color.White.copy(alpha = 0.4f), Offset(cx - 10f, cy - 28f), Offset(cx + 4f, cy), strokeWidth = 2f)
                        drawLine(Color.White.copy(alpha = 0.4f), Offset(cx + 4f, cy), Offset(cx - 6f, cy + 28f), strokeWidth = 2f)
                        drawCircle(Brush.radialGradient(listOf(Color.White.copy(0.18f), Color.Transparent), Offset(cx,cy), 40f), 40f, Offset(cx,cy))
                    }
                    Text(
                        text = "YVL",
                        style = MaterialTheme.typography.titleMedium,
                        fontFamily = bbhBartle,
                        letterSpacing = 3.sp,
                        color = Color.White,
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Welcome to YVL",
                        style = MaterialTheme.typography.headlineSmall,
                        fontFamily = bbhBartle,
                        letterSpacing = 4.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "music for the ones who feel it",
                        style = MaterialTheme.typography.bodySmall,
                        fontStyle = FontStyle.Italic,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }

                HorizontalDivider(
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f),
                    thickness = 0.5.dp
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "CRAFTED BY",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 3.sp,
                    )
                    Text(
                        text = "Shourya",
                        style = MaterialTheme.typography.headlineMedium,
                        fontFamily = FontFamily.Cursive,
                        fontStyle = FontStyle.Italic,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center,
                    )
                    Box(
                        modifier = Modifier.width(80.dp).height(1.dp)
                            .background(Brush.horizontalGradient(listOf(Color.Transparent, MaterialTheme.colorScheme.primary, Color.Transparent)))
                    )
                }

                Spacer(Modifier.height(4.dp))

                Button(
                    onClick = onDismissRequest,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Black)
                ) {
                    Text(
                        "START LISTENING",
                        fontFamily = bbhBartle,
                        letterSpacing = 4.sp,
                        fontSize = 14.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun WelcomeAppCard() { /* binary compat stub */ }
