/* Reference models and real tool commands for the chapter walkthroughs. */
const chapterExamples = [
{language:'C11 policy model - call from one owner',code:`#include <stdint.h>
#include <stdbool.h>
typedef enum { STARTUP, NORMAL, HIGH_WATER, SENSOR_ERROR } output_t;
typedef struct {
    int32_t millimeters;
    uint32_t acquired_ms;
    bool received, valid;
} level_sample_t;
typedef struct { bool alarm; uint32_t boot_ms; } monitor_t;
/* Initialize monitor.boot_ms to the current tick at boot. */
output_t monitor_step(monitor_t *m, level_sample_t s, uint32_t now) {
    if (!s.received)
        return (uint32_t)(now-m->boot_ms) < 3000U ? STARTUP : SENSOR_ERROR;
    if (!s.valid || (uint32_t)(now-s.acquired_ms) >= 3000U)
        return SENSOR_ERROR;
    if (s.millimeters >= 800) m->alarm=true;
    else if (s.millimeters <= 700) m->alarm=false;
    return m->alarm ? HIGH_WATER : NORMAL;
}
/* Preconditions: m is valid; timestamps share a millisecond timebase;
   observation gaps are within the unsigned counter range.
   Output electrical behavior for SENSOR_ERROR belongs to product policy. */`,
 trace:'With a fresh valid sample: 650 -> NORMAL; 810 -> HIGH_WATER; 750 -> HIGH_WATER; 690 -> NORMAL. At sample age 3000 ms return SENSOR_ERROR. A valid recovery sample in the hysteresis band retains the prior alarm latch.'},
{language:'Arm GNU tool commands - replace artifact paths with the actual build',code:`arm-none-eabi-size Debug/app.elf
arm-none-eabi-readelf -S Debug/app.elf
arm-none-eabi-nm -n Debug/app.elf
arm-none-eabi-objdump -d -S Debug/app.elf > app.dis
arm-none-eabi-addr2line -e Debug/app.elf -f -C 0x08001234
# 0x08001234 is an example, not a measured address.
# Use your actual PC, exact ELF and recorded load/runtime mapping.
# In the connected GDB console:
info registers
info address main
disassemble main`,
 trace:'Find the actual main address with symbols, then resolve that address using addr2line. Inspect section placement and startup separately. Unknown source lines are a diagnostic result, not permission to select a different ELF.'},
{language:'C11 single-owner bounded frame encoder',code:`#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
/* Frame: marker 0xA5, length, sequence, payload, XOR check.
   XOR is a teaching integrity check, not authentication. */
bool encode_frame(uint8_t *dst, size_t capacity, const uint8_t *payload,
                  size_t length, uint8_t sequence, size_t *written) {
    if (!written) return false;
    *written=0;
    if (!dst || (!payload && length != 0U) || length > 32U)
        return false;
    if (capacity < length+4U) return false;
    /* Precondition: dst/payload do not overlap. */
    dst[0]=0xA5U; dst[1]=(uint8_t)length; dst[2]=sequence;
    uint8_t check=(uint8_t)(dst[1]^dst[2]);
    for (size_t i=0; i<length; ++i) {
        dst[3+i]=payload[i]; check^=payload[i];
    }
    dst[3+length]=check; *written=length+4U;
    return true;
}
/* Retain dst unchanged until transport completion; validate every
   decoded length/check before publishing a received application frame. */`,
 trace:'For payload {0x10,0x20}, sequence 1, output is A5 02 01 10 20 33 and written=6. A five-byte destination rejects before frame bytes are changed. A 33-byte payload rejects even with a large destination.'},
{language:'FreeRTOS task integration - needs supported port/configuration and board adapters',code:`#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include <stdint.h>
#include <stdbool.h>
typedef struct { uint32_t sequence; TickType_t acquired; } event_t;
static QueueHandle_t events;
static uint32_t dropped; /* Only the producer writes this diagnostic. */
static void producer(void *arg) {
    (void)arg;
    TickType_t next=xTaskGetTickCount();
    const TickType_t period=pdMS_TO_TICKS(1000);
    configASSERT(period > 0);
    event_t item={0};
    for (;;) {
        item.sequence++;
        item.acquired=xTaskGetTickCount();
        if (xQueueSend(events,&item,0) != pdPASS) dropped++;
        vTaskDelayUntil(&next,period);
    }
}
static void consumer(void *arg) {
    (void)arg;
    event_t local;
    for (;;) {
        if (xQueueReceive(events,&local,portMAX_DELAY)==pdPASS) {
            /* Own a copy here. Apply bounded application policy.
               Do not put an unbounded UART print in this path. */
        }
    }
}
/* Call once before the scheduler starts. Stack sizes are examples
   in StackType_t units, NOT verified target stack budgets. */
bool create_pipeline(void) {
    TaskHandle_t producer_handle=NULL;
    events=xQueueCreate(8,sizeof(event_t));
    if (!events) return false;
    if (xTaskCreate(producer,"sample",256,NULL,2,&producer_handle)!=pdPASS) {
        vQueueDelete(events); events=NULL; return false;
    }
    if (xTaskCreate(consumer,"control",256,NULL,2,NULL)!=pdPASS) {
        vTaskDelete(producer_handle);
        vQueueDelete(events); events=NULL; return false;
    }
    return true;
}
/* Requires dynamic allocation and task-delete support enabled.
   Caller starts scheduling only after successful initialization. */`,
 trace:'Temporarily delay the consumer for ten production intervals. Queue occupancy is bounded at eight; additional nonblocking sends increment dropped. After consumption resumes, sequence gaps must match the observed drop policy. This example uses no ISR API or shared DMA buffer.'},
{language:'C11 bounded decoder - entry context and actual readable bounds required',code:lessons.find(l=>l.id===11).code,
 trace:'The valid basic-frame core PC offset is 24 bytes; an extended frame adds 72 bytes before the core area. Supply the captured entry SP, not the stack after a C prologue. Invalid bounds or stacking evidence should return false without reading a frame.'},
{language:'C11 bounded evidence ring - one writer, inspect only when quiescent',code:`#include <stdint.h>
#include <stddef.h>
typedef struct { uint32_t time, sequence, event, value; } record_t;
enum { RECORD_CAPACITY=16 };
static record_t records[RECORD_CAPACITY];
static size_t next_record, valid_records;
static uint32_t overwritten;
void record_event(record_t r) {
    records[next_record]=r;
    next_record=(next_record+1U)%RECORD_CAPACITY;
    if (valid_records < RECORD_CAPACITY) valid_records++;
    else overwritten++;
}
/* When production is stopped, oldest index is:
   (next_record + RECORD_CAPACITY - valid_records) % RECORD_CAPACITY.
   Snapshot/serialize in chronological order only under the stated
   single-owner/quiescent contract. This is not an ISR-safe multiwriter ring. */`,
 trace:'After recording sequence IDs 1 through 20, the retained chronological range is 5 through 20, valid_records=16, overwritten=4 and next_record=4. Log loss is explicit; a bounded ring cannot retain an unlimited history.'},
{language:'C11 progress-supervision model - immutable synchronized epoch snapshots',code:`#include <stdint.h>
#include <stdbool.h>
typedef struct {
    uint32_t last_check, previous[2];
} supervisor_t;
/* Initialize all fields from the initial time/epoch snapshot.
   Call often; return true requests ONE watchdog refresh. */
bool supervision_step(supervisor_t *s, uint32_t now,
                      const uint32_t epochs[2]) {
    if ((uint32_t)(now-s->last_check) < 1000U) return false;
    bool healthy=(epochs[0]!=s->previous[0]) &&
                 (epochs[1]!=s->previous[1]);
    s->previous[0]=epochs[0]; s->previous[1]=epochs[1];
    s->last_check=now;
    return healthy;
}
/* Each required component increments its epoch only on meaningful progress.
   Obtain a synchronized snapshot before calling. Select a real watchdog
   interval with scheduling/clock margin and a defined late-check policy.
   Epoch equality assumes fewer than 2^32 updates per observation window. */`,
 trace:'Initial epochs {0,0}; at 1000 ms snapshot {1,1} requests refresh. At 2000 ms {2,1} does not. At 3000 ms {3,1} still does not: an old successful report cannot satisfy future windows.'},
{language:'C11 fakeable sensor boundary - synchronous borrowed output',code:`#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
typedef bool (*read_bytes_fn)(void *, uint8_t *, size_t);
typedef struct { void *ctx; read_bytes_fn read; } bus_t;
/* Teaching wire format: little-endian unsigned millimeters, 0..5000. */
bool read_level(bus_t bus, uint16_t *published) {
    if (!published || !bus.read) return false;
    uint8_t bytes[2];
    if (!bus.read(bus.ctx,bytes,sizeof bytes)) return false;
    uint16_t candidate=(uint16_t)((uint16_t)bytes[0] |
                                ((uint16_t)bytes[1]<<8));
    if (candidate > 5000U) return false;
    *published=candidate; /* Single owner publishes only validated data. */
    return true;
}
typedef struct { bool fail; uint16_t value; } fake_t;
bool fake_read(void *ctx, uint8_t *dst, size_t n) {
    fake_t *f=(fake_t *)ctx;
    if (!f || !dst || n!=2U || f->fail) return false;
    dst[0]=(uint8_t)f->value; dst[1]=(uint8_t)(f->value>>8);
    return true;
}
/* Supply a bounded synchronous board adapter for real hardware.
   The interface cannot borrow its local bytes for later DMA completion. */`,
 trace:'With published=123 and fake {false,800}, the read succeeds and publishes 800. Fake failure or value 6000 returns false and preserves 123 when each rejection test starts with that sentinel.'}
];
chapterGuides.forEach((g,index)=>{g.example=chapterExamples[index];});
