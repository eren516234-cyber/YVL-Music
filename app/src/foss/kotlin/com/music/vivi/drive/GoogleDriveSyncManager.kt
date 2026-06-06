package iad1tya.echo.music.drive

import android.content.Context
import android.content.Intent
import java.io.File

/**
 * FOSS stub for GoogleDriveSyncManager.
 * Google Drive sync is not available in F-Droid / FOSS builds.
 */
object GoogleDriveSyncManager {

    fun getSignInIntent(context: Context): Intent = Intent()

    fun getSignedInAccount(context: Context): DriveAccountInfo? = null

    fun handleSignInResult(data: Intent?, context: Context): Result<DriveAccountInfo> =
        Result.failure(UnsupportedOperationException("Google Drive not available in FOSS build"))

    fun signOut(context: Context) {
        // No-op: Google Drive not available in FOSS build
    }

    suspend fun uploadBackupZip(context: Context, backupFile: File): Result<Unit> =
        Result.failure(UnsupportedOperationException("Google Drive not available in FOSS build"))

    suspend fun downloadBackupZip(context: Context): Result<File> =
        Result.failure(UnsupportedOperationException("Google Drive not available in FOSS build"))

    suspend fun getBackupTime(context: Context): Long? = null
}
