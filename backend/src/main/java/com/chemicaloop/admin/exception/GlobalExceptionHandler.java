package com.chemicaloop.admin.exception;

import com.chemicaloop.admin.utils.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理参数校验异常
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public Result<Void> handleValidationException(Exception e) {
        StringBuilder errorMsg = new StringBuilder();

        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
                errorMsg.append(fieldError.getDefaultMessage()).append("; ");
            }
        } else if (e instanceof BindException) {
            BindException ex = (BindException) e;
            for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
                errorMsg.append(fieldError.getDefaultMessage()).append("; ");
            }
        }

        log.error("参数校验异常: {}", errorMsg.toString());
        return Result.paramError(errorMsg.toString());
    }

    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        log.error("运行时异常: {}", e.getMessage(), e);
        return Result.error(e.getMessage());
    }

    /**
     * 处理其他异常
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);
        return Result.error("系统异常，请联系管理员");
    }
}
