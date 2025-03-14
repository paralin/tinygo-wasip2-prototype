package main

import "fmt"

// ErrorCode represents the enum "wasi:filesystem/types@0.2.0#error-code".
//
// Error codes returned by functions, similar to `errno` in POSIX.
// Not all of these error codes are returned by the functions provided by this
// API; some are used in higher-level library layers, and others are provided
// merely for alignment with POSIX.
//
//	enum error-code {
//		access,
//		would-block,
//		already,
//		bad-descriptor,
//		busy,
//		deadlock,
//		quota,
//		exist,
//		file-too-large,
//		illegal-byte-sequence,
//		in-progress,
//		interrupted,
//		invalid,
//		io,
//		is-directory,
//		loop,
//		too-many-links,
//		message-size,
//		name-too-long,
//		no-device,
//		no-entry,
//		no-lock,
//		insufficient-memory,
//		insufficient-space,
//		not-directory,
//		not-empty,
//		not-recoverable,
//		unsupported,
//		no-tty,
//		no-such-device,
//		overflow,
//		not-permitted,
//		pipe,
//		read-only,
//		invalid-seek,
//		text-file-busy,
//		cross-device
//	}
type ErrorCode uint8

const (
	// Permission denied, similar to `EACCES` in POSIX.
	ErrorCodeAccess ErrorCode = iota

	// Resource unavailable, or operation would block, similar to `EAGAIN` and `EWOULDBLOCK`
	// in POSIX.
	ErrorCodeWouldBlock

	// Connection already in progress, similar to `EALREADY` in POSIX.
	ErrorCodeAlready

	// Bad descriptor, similar to `EBADF` in POSIX.
	ErrorCodeBadDescriptor

	// Device or resource busy, similar to `EBUSY` in POSIX.
	ErrorCodeBusy

	// Resource deadlock would occur, similar to `EDEADLK` in POSIX.
	ErrorCodeDeadlock

	// Storage quota exceeded, similar to `EDQUOT` in POSIX.
	ErrorCodeQuota

	// File exists, similar to `EEXIST` in POSIX.
	ErrorCodeExist

	// File too large, similar to `EFBIG` in POSIX.
	ErrorCodeFileTooLarge

	// Illegal byte sequence, similar to `EILSEQ` in POSIX.
	ErrorCodeIllegalByteSequence

	// Operation in progress, similar to `EINPROGRESS` in POSIX.
	ErrorCodeInProgress

	// Interrupted function, similar to `EINTR` in POSIX.
	ErrorCodeInterrupted

	// Invalid argument, similar to `EINVAL` in POSIX.
	ErrorCodeInvalid

	// I/O error, similar to `EIO` in POSIX.
	ErrorCodeIO

	// Is a directory, similar to `EISDIR` in POSIX.
	ErrorCodeIsDirectory

	// Too many levels of symbolic links, similar to `ELOOP` in POSIX.
	ErrorCodeLoop

	// Too many links, similar to `EMLINK` in POSIX.
	ErrorCodeTooManyLinks

	// Message too large, similar to `EMSGSIZE` in POSIX.
	ErrorCodeMessageSize

	// Filename too long, similar to `ENAMETOOLONG` in POSIX.
	ErrorCodeNameTooLong

	// No such device, similar to `ENODEV` in POSIX.
	ErrorCodeNoDevice

	// No such file or directory, similar to `ENOENT` in POSIX.
	ErrorCodeNoEntry

	// No locks available, similar to `ENOLCK` in POSIX.
	ErrorCodeNoLock

	// Not enough space, similar to `ENOMEM` in POSIX.
	ErrorCodeInsufficientMemory

	// No space left on device, similar to `ENOSPC` in POSIX.
	ErrorCodeInsufficientSpace

	// Not a directory or a symbolic link to a directory, similar to `ENOTDIR` in POSIX.
	ErrorCodeNotDirectory

	// Directory not empty, similar to `ENOTEMPTY` in POSIX.
	ErrorCodeNotEmpty

	// State not recoverable, similar to `ENOTRECOVERABLE` in POSIX.
	ErrorCodeNotRecoverable

	// Not supported, similar to `ENOTSUP` and `ENOSYS` in POSIX.
	ErrorCodeUnsupported

	// Inappropriate I/O control operation, similar to `ENOTTY` in POSIX.
	ErrorCodeNoTTY

	// No such device or address, similar to `ENXIO` in POSIX.
	ErrorCodeNoSuchDevice

	// Value too large to be stored in data type, similar to `EOVERFLOW` in POSIX.
	ErrorCodeOverflow

	// Operation not permitted, similar to `EPERM` in POSIX.
	ErrorCodeNotPermitted

	// Broken pipe, similar to `EPIPE` in POSIX.
	ErrorCodePipe

	// Read-only file system, similar to `EROFS` in POSIX.
	ErrorCodeReadOnly

	// Invalid seek, similar to `ESPIPE` in POSIX.
	ErrorCodeInvalidSeek

	// Text file busy, similar to `ETXTBSY` in POSIX.
	ErrorCodeTextFileBusy

	// Cross-device link, similar to `EXDEV` in POSIX.
	ErrorCodeCrossDevice
)

var stringsErrorCode = [37]string{
	"access",
	"would-block",
	"already",
	"bad-descriptor",
	"busy",
	"deadlock",
	"quota",
	"exist",
	"file-too-large",
	"illegal-byte-sequence",
	"in-progress",
	"interrupted",
	"invalid",
	"io",
	"is-directory",
	"loop",
	"too-many-links",
	"message-size",
	"name-too-long",
	"no-device",
	"no-entry",
	"no-lock",
	"insufficient-memory",
	"insufficient-space",
	"not-directory",
	"not-empty",
	"not-recoverable",
	"unsupported",
	"no-tty",
	"no-such-device",
	"overflow",
	"not-permitted",
	"pipe",
	"read-only",
	"invalid-seek",
	"text-file-busy",
	"cross-device",
}

// String returns the string representation of an error code
func (e ErrorCode) String() string {
	if int(e) < len(stringsErrorCode) {
		return stringsErrorCode[e]
	}
	return fmt.Sprintf("unknown-error(%d)", e)
}

func main() {
	fmt.Println("Error Codes and their Numeric Values:")
	fmt.Println("====================================")

	for i := 0; i < len(stringsErrorCode); i++ {
		errorCode := ErrorCode(i)
		fmt.Printf("%2d: %s\n", i, errorCode)
	}
}
